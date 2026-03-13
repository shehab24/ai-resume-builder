import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const now = new Date();
        const oneDayAgo    = new Date(now.getTime() - 1  * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Active = user whose lastSeenAt falls within the time window.
        // lastSeenAt is updated on every authenticated page visit via POST /api/user/ping.
        const [
            dau, wau, mau,
            dauSeekers, dauRecruiters,
            wauSeekers, wauRecruiters,
            mauSeekers, mauRecruiters,
            newToday, newThisWeek, newThisMonth,
            neverActive,
            blockedCount,
        ] = await Promise.all([
            prisma.user.count({ where: { lastSeenAt: { gte: oneDayAgo } } }),
            prisma.user.count({ where: { lastSeenAt: { gte: sevenDaysAgo } } }),
            prisma.user.count({ where: { lastSeenAt: { gte: thirtyDaysAgo } } }),

            prisma.user.count({ where: { role: "JOB_SEEKER", lastSeenAt: { gte: oneDayAgo } } }),
            prisma.user.count({ where: { role: "RECRUITER",  lastSeenAt: { gte: oneDayAgo } } }),
            prisma.user.count({ where: { role: "JOB_SEEKER", lastSeenAt: { gte: sevenDaysAgo } } }),
            prisma.user.count({ where: { role: "RECRUITER",  lastSeenAt: { gte: sevenDaysAgo } } }),
            prisma.user.count({ where: { role: "JOB_SEEKER", lastSeenAt: { gte: thirtyDaysAgo } } }),
            prisma.user.count({ where: { role: "RECRUITER",  lastSeenAt: { gte: thirtyDaysAgo } } }),

            prisma.user.count({ where: { createdAt: { gte: oneDayAgo } } }),
            prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
            prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

            // Suspected inactive/fake: older than 30 days, never visited (lastSeenAt null), no applications
            prisma.user.count({
                where: {
                    createdAt:    { lt: thirtyDaysAgo },
                    lastSeenAt:   null,
                    applications: { none: {} },
                },
            }),

            prisma.user.count({ where: { isBlocked: true } }),
        ]);

        return NextResponse.json({
            dau, wau, mau,
            breakdown: {
                daily:   { seekers: dauSeekers,  recruiters: dauRecruiters },
                weekly:  { seekers: wauSeekers,  recruiters: wauRecruiters },
                monthly: { seekers: mauSeekers,  recruiters: mauRecruiters },
            },
            signups: {
                today:     newToday,
                thisWeek:  newThisWeek,
                thisMonth: newThisMonth,
            },
            suspectedInactive: neverActive,
            blockedCount,
        });
    } catch (error) {
        console.error("Error fetching active user stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
