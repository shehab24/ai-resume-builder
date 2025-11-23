import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

        const { id } = await params;

        // Verify ownership
        const job = await prisma.job.findUnique({
            where: { id },
        });

        if (!job || job.recruiterId !== user.id) {
            return NextResponse.json({ error: "Job not found or unauthorized" }, { status: 404 });
        }

        // Delete job (and cascade delete applications/notifications if needed, but Prisma handles cascade if configured, or we do it manually)
        // For now, simple delete.
        await prisma.job.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting job:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

        const { id } = await params;
        const body = await req.json();

        // Verify ownership
        const job = await prisma.job.findUnique({
            where: { id },
        });

        if (!job || job.recruiterId !== user.id) {
            return NextResponse.json({ error: "Job not found or unauthorized" }, { status: 404 });
        }

        // Update job
        const updatedJob = await prisma.job.update({
            where: { id },
            data: {
                title: body.title,
                company: body.company,
                description: body.description,
                location: body.location,
                jobType: body.jobType,
                workMode: body.workMode,
                experienceLevel: body.experienceLevel,
                salaryMin: body.salaryMin,
                salaryMax: body.salaryMax,
                requirements: body.requirements,
                benefits: body.benefits,
                applicationDeadline: body.applicationDeadline ? new Date(body.applicationDeadline) : null,
                tasks: body.tasks,
            },
        });

        return NextResponse.json(updatedJob);
    } catch (error) {
        console.error("Error updating job:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
