import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify Admin Role
        const currentUser = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!currentUser || currentUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const { id } = await params;

        // Delete related records first to avoid foreign key constraint errors
        await prisma.application.deleteMany({
            where: { jobId: id },
        });

        // Now delete the job
        await prisma.job.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Job deleted successfully" });
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

        // Verify Admin Role
        const currentUser = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!currentUser || currentUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { id } = await params;

        // Allow updating basic fields
        const { title, company, description, location, jobType, status } = body;

        const updatedJob = await prisma.job.update({
            where: { id },
            data: {
                title,
                company,
                description,
                location,
                jobType,
                // status // If we had a status field (e.g. ACTIVE/CLOSED), we could update it. 
                // The schema doesn't seem to have a status field explicitly, but we can add it later if needed.
                // For now, we'll just update the fields present in the schema.
            },
        });

        return NextResponse.json(updatedJob);
    } catch (error) {
        console.error("Error updating job:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
