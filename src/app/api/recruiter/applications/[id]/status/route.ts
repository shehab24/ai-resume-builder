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
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        const application = await prisma.application.update({
            where: { id },
            data: { status },
            include: { job: { select: { title: true } } }
        });

        // Notify Job Seeker
        await prisma.notification.create({
            data: {
                userId: application.userId,
                title: "Application Status Update",
                message: `Your application for ${application.job.title} has been updated to ${status}.`,
                type: "STATUS_UPDATE",
                link: `/dashboard/job-seeker`
            }
        });

        return NextResponse.json(application);
    } catch (error) {
        console.error("Error updating application status:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
