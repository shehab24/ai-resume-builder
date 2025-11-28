import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify Admin Role
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        // Fetch Stats
        const [
            totalUsers,
            jobSeekers,
            recruiters,
            totalJobs,
            totalApplications
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: "JOB_SEEKER" } }),
            prisma.user.count({ where: { role: "RECRUITER" } }),
            prisma.job.count(),
            prisma.application.count(),
        ]);

        return NextResponse.json({
            totalUsers,
            jobSeekers,
            recruiters,
            totalJobs,
            totalApplications
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
