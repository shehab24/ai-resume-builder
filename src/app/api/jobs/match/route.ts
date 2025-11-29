import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Fetch all jobs EXCEPT those posted by the current user
        // For MongoDB: sourceId null check needs special handling
        const allJobsNotByUser = await prisma.job.findMany({
            where: {
                recruiterId: {
                    not: user.id
                }
            },
            include: {
                recruiter: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                source: {
                    select: {
                        name: true,
                        isActive: true
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        // Filter in JavaScript: show internal jobs OR external jobs from active sources
        const jobs = allJobsNotByUser.filter(job => {
            if (!job.sourceId) {
                // Internal job - always show
                return true;
            } else {
                // External job - only show if source is active
                return job.source?.isActive === true;
            }
        });

        console.log(`[Jobs API] User: ${user.email} (ID: ${user.id})`);
        console.log(`[Jobs API] Found ${jobs.length} jobs (filtered from ${allJobsNotByUser.length} total)`);
        jobs.forEach(job => {
            console.log(`  - ${job.title} (Recruiter: ${job.recruiter.name}, External: ${job.isExternal})`);
        });

        return NextResponse.json(jobs);
    } catch (error) {
        console.error("Error fetching jobs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
