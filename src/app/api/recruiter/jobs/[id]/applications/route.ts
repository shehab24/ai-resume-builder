import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

        // Verify the job belongs to this recruiter
        const job = await prisma.job.findFirst({
            where: {
                id,
                recruiterId: user.id,
            },
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        const applications = await prisma.application.findMany({
            where: { jobId: id },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ applications });
    } catch (error) {
        console.error("Error fetching applications:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
