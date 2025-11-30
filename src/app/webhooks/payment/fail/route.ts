import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const formData = await req.formData();
    const tran_id = formData.get('tran_id') as string;

    try {
        await prisma.payment.update({
            where: { transactionId: tran_id },
            data: {
                status: 'FAILED',
                failureReason: 'Payment failed by user or gateway'
            }
        });
    } catch (error) {
        console.error('Error updating failed payment:', error);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/payment/failed`, 303);
}
