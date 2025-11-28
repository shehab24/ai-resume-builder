import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// Helper function to calculate job match score
// Helper function to calculate job match score
function calculateMatchScore(resume: any, requirements: string[]): number {
    if (!requirements || requirements.length === 0) return 100;

    // Combine all resume text for searching
    const resumeText = [
        ...(resume.skills || []),
        ...(resume.experience?.map((e: any) => `${e.position} ${e.company} ${e.description}`) || []),
        resume.summary || "",
        resume.education?.map((e: any) => `${e.degree} ${e.school}`) || []
    ].join(" ").toLowerCase();

    const jobRequirements = requirements.map(r => r.toLowerCase());

    let matchCount = 0;
    for (const req of jobRequirements) {
        // Check if the requirement exists in the resume text
        if (resumeText.includes(req)) {
            matchCount++;
        }
    }

    return Math.round((matchCount / jobRequirements.length) * 100);
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user || user.role !== "RECRUITER") {
            return NextResponse.json({ error: "Unauthorized: Recruiter role required" }, { status: 403 });
        }

        const body = await req.json();
        console.log("CREATE Job Body:", body); // Debug log

        const {
            title,
            company,
            description,
            location,
            country, // Added
            jobType,
            workMode,
            experienceLevel,
            salaryMin,
            salaryMax,
            requirements,
            benefits,
            applicationDeadline,
            tasks,
        } = body;

        const job = await prisma.job.create({
            data: {
                recruiterId: user.id,
                title,
                company,
                description,
                location,
                country, // Added
                jobType,
                workMode,
                experienceLevel,
                salaryMin,
                salaryMax,
                requirements,
                benefits: benefits || [],
                applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
                tasks: tasks || [],
            },
        });

        // Notify all Job Seekers
        const jobSeekers = await prisma.user.findMany({
            where: { role: "JOB_SEEKER" },
            select: {
                id: true,
                autoApply: true,
                name: true,
                email: true,
                matchThreshold: true,
                autoApplyCountry: true
            }
        });

        if (jobSeekers.length > 0) {
            const notifications = jobSeekers.map((seeker: { id: string; autoApply: boolean; name: string | null; email: string }) => ({
                userId: seeker.id,
                title: "New Job Posted",
                message: `A new job "${title}" at ${company} has been posted.`,
                type: "JOB_POSTED",
                link: `/dashboard/job-seeker/jobs/${job.id}`
            }));

            await prisma.notification.createMany({
                data: notifications
            });
        }

        // Auto-Apply logic has been moved to a Cron Job (/api/cron/auto-apply)
        // to prevent server lag and ensure scalability.

        return NextResponse.json(job);

        return NextResponse.json(job);
    } catch (error) {
        console.error("Error creating job:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
