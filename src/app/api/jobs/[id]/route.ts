import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Fetch user to get DB ID
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const job = await prisma.job.findUnique({
            where: { id },
            include: { recruiter: { select: { name: true, email: true } } },
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        // Check if user has applied
        const existingApplication = await prisma.application.findFirst({
            where: {
                jobId: id,
                userId: user.id // Use DB ID
            }
        });

        // Check if this is the user's own job posting
        const isOwnJob = job.recruiterId === user.id;

        // Build a salary string if min/max are present
        const salary = job.salaryMin && job.salaryMax ? `${job.salaryMin}-${job.salaryMax}` : job.salaryMin || job.salaryMax || undefined;

        const response = {
            id: job.id,
            title: job.title,
            company: job.company, // Added company field
            description: job.description,
            location: job.location,
            country: job.country, // Added
            salary,
            requirements: job.requirements,
            recruiter: job.recruiter,
            jobType: job.jobType,
            workMode: job.workMode,
            experienceLevel: job.experienceLevel,
            benefits: job.benefits,
            applicationDeadline: job.applicationDeadline,
            tasks: job.tasks,
            hasApplied: !!existingApplication, // Add this flag
            isOwnJob: isOwnJob // Add this flag to indicate if user posted this job
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching job:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
