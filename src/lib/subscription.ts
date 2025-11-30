import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function getActiveSubscription() {
    const { userId } = await auth();

    if (!userId) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
            subscriptions: {
                where: { status: 'ACTIVE' },
                orderBy: { endDate: 'desc' },
                take: 1
            }
        }
    });

    return user?.subscriptions[0] || null;
}

export async function isPro() {
    const subscription = await getActiveSubscription();
    return subscription?.plan === 'PRO';
}

export async function checkResumeLimit() {
    const { userId } = await auth();

    if (!userId) {
        return { canCreate: false, count: 0, limit: 0 };
    }

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
            resumes: true,
            subscriptions: {
                where: { status: 'ACTIVE' },
                orderBy: { endDate: 'desc' },
                take: 1
            }
        }
    });

    if (!user) {
        return { canCreate: false, count: 0, limit: 0 };
    }

    const resumeCount = user.resumes.length;
    const isProUser = user.subscriptions[0]?.plan === 'PRO';
    const limit = isProUser ? Infinity : 2;
    const canCreate = isProUser || resumeCount < 2;

    return {
        canCreate,
        count: resumeCount,
        limit: isProUser ? 'Unlimited' : 2,
        isPro: isProUser
    };
}
