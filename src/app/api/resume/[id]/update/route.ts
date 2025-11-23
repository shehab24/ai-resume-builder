import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { content } = body;

        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        // Find the resume and verify ownership
        const existingResume = await prisma.resume.findFirst({
            where: {
                id,
                user: {
                    clerkId: user.id,
                },
            },
        });

        if (!existingResume) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }

        // Update the resume
        const updatedResume = await prisma.resume.update({
            where: { id },
            data: {
                content: JSON.stringify(content),
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true, resume: updatedResume });
    } catch (error) {
        console.error("Error updating resume:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
