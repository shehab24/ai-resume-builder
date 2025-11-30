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

export async function GET(req: Request) {
    console.log('✅ bKash Callback Received');
    const url = new URL(req.url);
    const paymentID = url.searchParams.get('paymentID');
    const status = url.searchParams.get('status');

    console.log('Payment ID:', paymentID);
    console.log('Status:', status);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!paymentID) {
        console.log('❌ Missing paymentID');
        return NextResponse.redirect(`${baseUrl}/payment/failed`, 303);
    }

    if (status === 'cancel' || status === 'failure') {
        console.log('❌ Payment cancelled or failed');
        return NextResponse.redirect(`${baseUrl}/payment/failed`, 303);
    }

    // Redirect to completion page where user can finalize
    return NextResponse.redirect(`${baseUrl}/payment/bkash?paymentID=${paymentID}`, 303);
}
