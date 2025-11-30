import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// bKash API endpoints
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
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, amount, planType } = await req.json();

    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get user details
    const user = await prisma.user.findUnique({
        where: { clerkId: userId }
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine planType based on amount and user role if not explicitly provided
    let finalPlanType = planType;
    if (!finalPlanType) {
        if (amount === 999) {
            // 999 always gives ALL_FEATURES_PRO (both job seeker and recruiter features)
            finalPlanType = 'ALL_FEATURES_PRO';
        } else if (amount === 299) {
            // 299 gives JOB_SEEKER_PRO only
            finalPlanType = 'JOB_SEEKER_PRO';
        } else {
            finalPlanType = 'UNKNOWN';
        }
    }

    try {
        // Create payment record
        await prisma.payment.create({
            data: {
                userId: user.id,
                transactionId: invoiceNumber,
                amount,
                currency: 'BDT',
                status: 'PENDING',
                description: `${plan} Subscription Payment`,
                planType: finalPlanType
            }
        });

        // Get bKash token
        const token = await getBkashToken();

        // Create payment
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const appKey = process.env.BKASH_APP_KEY!;

        const bKashRequestBody = {
            mode: '0011',
            payerReference: invoiceNumber,
            callbackURL: 'http://localhost:3000',
            amount: amount.toString(),
            currency: 'BDT',
            intent: 'sale',
            merchantInvoiceNumber: invoiceNumber,
        };

        console.log('Creating bKash payment with data:', bKashRequestBody);

        const createPaymentResponse = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
                'X-APP-Key': appKey,
            },
            body: JSON.stringify(bKashRequestBody),
        });

        const paymentData = await createPaymentResponse.json();
        console.log('bKash create payment response:', paymentData);

        if (paymentData.statusCode === '0000') {
            return NextResponse.json({
                success: true,
                paymentID: paymentData.paymentID,
                bkashURL: paymentData.bkashURL,
            });
        } else {
            console.error('bKash payment creation failed:', paymentData);
            return NextResponse.json({
                error: paymentData.statusMessage || 'Payment initialization failed',
                details: paymentData
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Payment initialization error:', error);
        return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
    }
}
