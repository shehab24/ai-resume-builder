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

        // Fetch all jobs (including those posted by the current user)
        // Recruiters can see their own jobs when they switch to job seeker role
        const allJobs = await prisma.job.findMany({
            include: {
                recruiter: {
                    select: {
                        name: true,
                        email: true,
                        id: true
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
        const jobs = allJobs.filter(job => {
            if (!job.sourceId) {
                // Internal job - always show
                return true;
            } else {
                // External job - only show if source is active
                return job.source?.isActive === true;
            }
        });

        console.log(`[Jobs API] User: ${user.email} (ID: ${user.id})`);
        console.log(`[Jobs API] Found ${jobs.length} jobs (filtered from ${allJobs.length} total)`);
        jobs.forEach(job => {
            const isOwn = job.recruiterId === user.id;
            console.log(`  - ${job.title} (Recruiter: ${job.recruiter.name}, RecruiterId: ${job.recruiterId}, UserId: ${user.id}, Own: ${isOwn}, External: ${job.isExternal})`);
        });

        return NextResponse.json(jobs);
    } catch (error) {
        console.error("Error fetching jobs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
