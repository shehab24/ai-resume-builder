import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q') || '';

        // Get current user to find their company
        const currentUser = await prisma.user.findUnique({
            where: { clerkId: userId }
        });

        if (!currentUser || currentUser.role !== 'RECRUITER') {
            return NextResponse.json({ error: 'Only recruiters can search' }, { status: 403 });
        }

        // Search for recruiters (excluding current user)
        // IMPORTANT: Only users with role='RECRUITER' are returned
        // This prevents job seekers from being added to interview panels
        const recruiters = await prisma.user.findMany({
            where: {
                role: 'RECRUITER', // Only recruiters, never job seekers
                id: { not: currentUser.id },
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                photoUrl: true
            },
            take: 10
        });

        return NextResponse.json({ recruiters });
    } catch (error) {
        console.error('Error searching recruiters:', error);
        return NextResponse.json({ error: 'Failed to search recruiters' }, { status: 500 });
    }
}
