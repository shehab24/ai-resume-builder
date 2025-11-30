import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    // IPN handling logic would go here
    // For now, we just acknowledge receipt
    return NextResponse.json({ status: 'IPN received' });
}
