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

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { id } = await params;

        // Verify ownership
        const resume = await prisma.resume.findUnique({
            where: { id },
        });

        if (!resume || resume.userId !== user.id) {
            return NextResponse.json({ error: "Resume not found or unauthorized" }, { status: 404 });
        }

        // Transaction to unset others and set this one
        await prisma.$transaction([
            prisma.resume.updateMany({
                where: { userId: user.id },
                data: { isDefault: false },
            }),
            prisma.resume.update({
                where: { id },
                data: { isDefault: true },
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error setting default resume:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
