import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
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

        const jobs = await prisma.job.findMany({
            where: { recruiterId: user.id },
            include: {
                recruiter: { select: { name: true, email: true } },
                applications: true,
            },
        });

        const jobsWithMeta = jobs.map((job) => ({
            id: job.id,
            title: job.title,
            description: job.description,
            location: job.location,
            salary: job.salaryMin && job.salaryMax ? `${job.salaryMin}-${job.salaryMax}` : job.salaryMin || job.salaryMax || undefined,
            requirements: job.requirements,
            recruiter: job.recruiter,
            applicantCount: job.applications.length,
            tasks: job.tasks,
        }));

        return NextResponse.json(jobsWithMeta);
    } catch (error) {
        console.error("Error fetching recruiter jobs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
