import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { index } = await req.json();

        const application = await prisma.application.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        if (application.user.clerkId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Remove the submission at the specified index
        const updatedSubmissions = [...application.taskSubmissions];
        if (index >= 0 && index < updatedSubmissions.length) {
            updatedSubmissions.splice(index, 1);
        }

        const updatedApplication = await prisma.application.update({
            where: { id },
            data: {
                taskSubmissions: updatedSubmissions as any,
                // Reset scores if all tasks are deleted? 
                // Maybe keep them for now, or reset if empty.
                // Let's reset if empty to force re-evaluation on new submit.
                ...(updatedSubmissions.length === 0 ? {
                    taskScore: null,
                    compositeScore: null,
                    aiEvaluation: null
                } : {})
            }
        });

        return NextResponse.json(updatedApplication);
    } catch (error) {
        console.error("Error deleting task:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
