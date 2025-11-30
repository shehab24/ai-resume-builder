import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BKASH_BASE_URL = process.env.BKASH_IS_SANDBOX === 'true'
    ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
    : 'https://tokenized.pay.bka.sh/v1.2.0-beta';

// Get bKash token
async function getBkashToken() {
    const username = process.env.BKASH_USERNAME!;
    const password = process.env.BKASH_PASSWORD!;
    const appKey = process.env.BKASH_APP_KEY!;
    const appSecret = process.env.BKASH_APP_SECRET!;

    const response = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'username': username,
            'password': password,
        },
        body: JSON.stringify({
            app_key: appKey,
            app_secret: appSecret,
        }),
    });

    const data = await response.json();
    return data.id_token;
}

export async function POST(req: Request) {
    console.log('✅ bKash Execute Payment Request');
    const { paymentID } = await req.json();

    console.log('Payment ID:', paymentID);

    if (!paymentID) {
        return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
    }

    try {
        // Get bKash token
        const token = await getBkashToken();
        const appKey = process.env.BKASH_APP_KEY!;

        // Execute payment
        const executeResponse = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
                'X-APP-Key': appKey,
            },
            body: JSON.stringify({
                paymentID: paymentID,
            }),
        });

        const executeData = await executeResponse.json();
        console.log('Execute response:', executeData);

        if (executeData.statusCode === '0000' && executeData.transactionStatus === 'Completed') {
            const invoiceNumber = executeData.merchantInvoiceNumber;

            // Update payment record
            await prisma.payment.update({
                where: { transactionId: invoiceNumber },
                data: {
                    status: 'SUCCESS',
                    bankTransactionId: executeData.trxID,
                    paymentMethod: 'bKash',
                }
            });

            // Get payment to create/update subscription
            const payment = await prisma.payment.findUnique({
                where: { transactionId: invoiceNumber },
                include: { user: true }
            });

            if (payment) {
                // Check if user already has an active subscription
                const existingSubscription = await prisma.subscription.findFirst({
                    where: {
                        userId: payment.userId,
                        status: 'ACTIVE'
                    }
                });

                if (existingSubscription) {
                    // Extend existing subscription
                    await prisma.subscription.update({
                        where: { id: existingSubscription.id },
                        data: {
                            endDate: new Date(existingSubscription.endDate.getTime() + 30 * 24 * 60 * 60 * 1000),
                            updatedAt: new Date()
                        }
                    });

                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: { subscriptionId: existingSubscription.id }
                    });
                } else {
                    // Create new subscription
                    const newSubscription = await prisma.subscription.create({
                        data: {
                            userId: payment.userId,
                            plan: 'PRO',
                            planType: payment.planType || 'ALL_FEATURES_PRO', // Default to all features if not specified
                            status: 'ACTIVE',
                            amount: payment.amount,
                            startDate: new Date(),
                            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        }
                    });

                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: { subscriptionId: newSubscription.id }
                    });
                }
            }

            console.log('✅ Payment successful and subscription updated');
            return NextResponse.json({
                success: true,
                message: 'Payment completed successfully',
                transactionID: executeData.trxID
            });
        } else if (executeData.statusCode === '2117') {
            // Payment already executed, query the status
            console.log('⚠️ Payment already executed, querying status...');

            const queryResponse = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/payment/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token,
                    'X-APP-Key': appKey,
                },
                body: JSON.stringify({
                    paymentID: paymentID,
                }),
            });

            const queryData = await queryResponse.json();
            console.log('Query response:', queryData);

            if (queryData.transactionStatus === 'Completed') {
                const invoiceNumber = queryData.merchantInvoiceNumber;

                // Update payment record
                await prisma.payment.update({
                    where: { transactionId: invoiceNumber },
                    data: {
                        status: 'SUCCESS',
                        bankTransactionId: queryData.trxID,
                        paymentMethod: 'bKash',
                    }
                });

                // Get payment to create/update subscription
                const payment = await prisma.payment.findUnique({
                    where: { transactionId: invoiceNumber },
                    include: { user: true }
                });

                if (payment) {
                    const existingSubscription = await prisma.subscription.findFirst({
                        where: {
                            userId: payment.userId,
                            status: 'ACTIVE'
                        }
                    });

                    if (existingSubscription) {
                        await prisma.subscription.update({
                            where: { id: existingSubscription.id },
                            data: {
                                endDate: new Date(existingSubscription.endDate.getTime() + 30 * 24 * 60 * 60 * 1000),
                                updatedAt: new Date()
                            }
                        });

                        await prisma.payment.update({
                            where: { id: payment.id },
                            data: { subscriptionId: existingSubscription.id }
                        });
                    } else {
                        const newSubscription = await prisma.subscription.create({
                            data: {
                                userId: payment.userId,
                                plan: 'PRO',
                                planType: payment.planType || 'ALL_FEATURES_PRO', // Default to all features if not specified
                                status: 'ACTIVE',
                                amount: payment.amount,
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            }
                        });

                        await prisma.payment.update({
                            where: { id: payment.id },
                            data: { subscriptionId: newSubscription.id }
                        });
                    }
                }

                console.log('✅ Payment was already completed, subscription updated');
                return NextResponse.json({
                    success: true,
                    message: 'Payment was already completed successfully',
                    transactionID: queryData.trxID
                });
            } else {
                console.log('⚠️ Payment not completed yet, status:', queryData.transactionStatus);
                return NextResponse.json({
                    success: false,
                    error: `Payment status: ${queryData.transactionStatus}. Please complete the payment on bKash first.`,
                    status: queryData.transactionStatus
                }, { status: 400 });
            }
        } else {
            console.error('❌ Payment execution failed:', executeData);
            return NextResponse.json({
                success: false,
                error: executeData.statusMessage || 'Payment execution failed'
            }, { status: 400 });
        }
    } catch (error) {
        console.error('Payment execution error:', error);
        return NextResponse.json({ error: 'Payment execution failed' }, { status: 500 });
    }
}
