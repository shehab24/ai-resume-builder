import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Find the resume and verify ownership
        const resume = await prisma.resume.findFirst({
            where: {
                id,
                user: {
                    clerkId: user.id,
                },
            },
        });

        if (!resume) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }

        // Delete the resume
        await prisma.resume.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: "Resume deleted successfully" });
    } catch (error) {
        console.error("Error deleting resume:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
