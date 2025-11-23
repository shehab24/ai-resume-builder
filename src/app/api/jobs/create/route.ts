import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

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
        const {
            title,
            company,
            description,
            location,
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
            select: { id: true }
        });

        if (jobSeekers.length > 0) {
            const notifications = jobSeekers.map(seeker => ({
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

        return NextResponse.json(job);
    } catch (error) {
        console.error("Error creating job:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
