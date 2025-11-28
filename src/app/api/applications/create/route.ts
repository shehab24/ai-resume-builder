import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { jobId } = body;

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Prevent recruiters from applying to jobs
        if (user.role === "RECRUITER") {
            return NextResponse.json({ error: "Recruiters cannot apply to jobs. Please switch to a job seeker account." }, { status: 403 });
        }

        const job = await prisma.job.findUnique({
            where: { id: jobId },
            select: { recruiterId: true, title: true, tasks: true }
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        // Prevent users from applying to their own jobs
        if (job.recruiterId === user.id) {
            return NextResponse.json({ error: "You cannot apply to your own job posting" }, { status: 400 });
        }

        const existingApplication = await prisma.application.findFirst({
            where: {
                userId: user.id,
                jobId: jobId
            }
        });

        if (existingApplication) {
            return NextResponse.json({ error: "You have already applied to this job" }, { status: 400 });
        }

        const application = await prisma.application.create({
            data: {
                jobId,
                userId: user.id,
                status: "PENDING",
                taskSubmissions: [], // Initialize empty
            },
        });

        // Notify Recruiter
        await prisma.notification.create({
            data: {
                userId: job.recruiterId,
                title: "New Application Received",
                message: `You have a new applicant for ${job.title}`,
                type: "APPLICATION_RECEIVED",
                link: `/dashboard/recruiter/applications/${application.id}`
            }
        });

        return NextResponse.json({ ...application, tasks: job.tasks });
    } catch (error) {
        console.error("Error creating application:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
