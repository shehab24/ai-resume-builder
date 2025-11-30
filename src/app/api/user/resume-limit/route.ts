import { NextResponse } from 'next/server';
import { checkResumeLimit } from '@/lib/subscription';

export async function GET() {
    try {
        const result = await checkResumeLimit();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error checking resume limit:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
