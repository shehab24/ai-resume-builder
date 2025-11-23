import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user || user.role !== "RECRUITER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const activeJobsCount = await prisma.job.count({
            where: { recruiterId: user.id },
        });

        const jobs = await prisma.job.findMany({
            where: { recruiterId: user.id },
            include: { _count: { select: { applications: true } } },
        });

        const totalApplications = jobs.reduce((acc, job) => acc + job._count.applications, 0);

        return NextResponse.json({
            activeJobs: activeJobsCount,
            totalApplications,
        });
    } catch (error) {
        console.error("Error fetching recruiter stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
