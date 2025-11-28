import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

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
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;
        const { status } = await req.json();

        const application = await prisma.application.findUnique({
            where: { id },
            include: { job: true }
        });

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        if (application.job.recruiterId !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const updatedApplication = await prisma.application.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json(updatedApplication);
    } catch (error) {
        console.error("Error updating status:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
