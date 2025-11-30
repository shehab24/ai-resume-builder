import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    console.log('✅ Success Webhook Received');
    const formData = await req.formData();
    const tran_id = formData.get('tran_id') as string;
    console.log('Transaction ID:', tran_id);
    const val_id = formData.get('val_id') as string;

    // Validate payment with SSLCommerz via direct API
    const isLive = process.env.SSLCOMMERZ_IS_LIVE === 'true';
    const storeId = process.env.SSLCOMMERZ_STORE_ID!;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD!;

    const validationUrl = isLive
        ? 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'
        : 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php';

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let redirectUrl = `${baseUrl}/payment/failed`;

    try {
        const params = new URLSearchParams({
            val_id: val_id,
            store_id: storeId,
            store_passwd: storePassword,
            format: 'json'
        });

        const response = await fetch(`${validationUrl}?${params.toString()}`);
        const validation = await response.json();

        if (validation.status === 'VALID' || validation.status === 'VALIDATED') {
            // Update payment record
            await prisma.payment.update({
                where: { transactionId: tran_id },
                data: {
                    status: 'SUCCESS',
                    bankTransactionId: formData.get('bank_tran_id') as string,
                    cardType: formData.get('card_type') as string,
                    validationId: val_id,
                    paymentMethod: formData.get('card_type') as string
                }
            });

            // Create/update subscription
            const payment = await prisma.payment.findUnique({
                where: { transactionId: tran_id },
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
                            endDate: new Date(existingSubscription.endDate.getTime() + 30 * 24 * 60 * 60 * 1000), // Add 30 days
                            updatedAt: new Date()
                        }
                    });

                    // Link payment to subscription
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
                            status: 'ACTIVE',
                            amount: payment.amount,
                            startDate: new Date(),
                            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                        }
                    });

                    // Link payment to subscription
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: { subscriptionId: newSubscription.id }
                    });
                }
            }

            redirectUrl = `${baseUrl}/payment/success?tran_id=${tran_id}`;
        } else {
            console.error('Payment validation failed:', validation);
            await prisma.payment.update({
                where: { transactionId: tran_id },
                data: { status: 'FAILED', failureReason: 'Validation failed' }
            });
        }
    } catch (error) {
        console.error('Payment validation error:', error);
    }

    // Use proper HTTP redirect
    return NextResponse.redirect(redirectUrl, 303);
}

// Handle GET requests (when SSLCommerz redirects via browser)
export async function GET(req: Request) {
    console.log('✅ Success Webhook GET Request Received');
    const url = new URL(req.url);

    // Log all query parameters
    console.log('All query params:', Object.fromEntries(url.searchParams));

    let tran_id = url.searchParams.get('tran_id');
    let val_id = url.searchParams.get('val_id');

    // SSLCommerz might send with different parameter names
    if (!tran_id) tran_id = url.searchParams.get('tran_id');
    if (!val_id) val_id = url.searchParams.get('value_a') || url.searchParams.get('val_id');

    console.log('GET Request - Transaction ID:', tran_id);
    console.log('GET Request - Validation ID:', val_id);
    console.log('GET Request - Full URL:', req.url);

    if (!tran_id) {
        console.log('⚠️ Missing tran_id - This might be a direct redirect from SSLCommerz');
        console.log('Note: SSLCommerz should send tran_id and other params in the callback');
        console.log('Please check SSLCommerz integration settings');

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // As a fallback, redirect to success page
        // The user will need to check their dashboard for subscription status
        return NextResponse.redirect(`${baseUrl}/payment/success`, 303);
    }

    // Validate payment with SSLCommerz via direct API
    const isLive = process.env.SSLCOMMERZ_IS_LIVE === 'true';
    const storeId = process.env.SSLCOMMERZ_STORE_ID!;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD!;

    const validationUrl = isLive
        ? 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'
        : 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php';

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let redirectUrl = `${baseUrl}/payment/failed`;

    try {
        const params = new URLSearchParams({
            val_id: val_id,
            store_id: storeId,
            store_passwd: storePassword,
            format: 'json'
        });

        const response = await fetch(`${validationUrl}?${params.toString()}`);
        const validation = await response.json();

        if (validation.status === 'VALID' || validation.status === 'VALIDATED') {
            // Update payment record
            await prisma.payment.update({
                where: { transactionId: tran_id },
                data: {
                    status: 'SUCCESS',
                    bankTransactionId: validation.bank_tran_id,
                    cardType: validation.card_type,
                    validationId: val_id,
                    paymentMethod: validation.card_type
                }
            });

            // Create/update subscription
            const payment = await prisma.payment.findUnique({
                where: { transactionId: tran_id },
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

            redirectUrl = `${baseUrl}/payment/success?tran_id=${tran_id}`;
        }
    } catch (error) {
        console.error('Payment validation error:', error);
    }

    return NextResponse.redirect(redirectUrl, 303);
}
