import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { id } = await params;
        const body = await req.json();
        const { submission } = body;

        // Verify ownership
        const application = await prisma.application.findUnique({
            where: { id },
        });

        if (!application || application.userId !== user.id) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        // Add submission to taskSubmissions array
        const updatedApplication = await prisma.application.update({
            where: { id },
            data: {
                taskSubmissions: [...application.taskSubmissions, submission],
            },
        });

        return NextResponse.json(updatedApplication);
    } catch (error) {
        console.error("Error submitting task:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
