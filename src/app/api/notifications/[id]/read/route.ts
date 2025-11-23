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
        const notification = await prisma.notification.findUnique({
            where: { id },
        });

        if (!notification || notification.userId !== user.id) {
            return NextResponse.json({ error: "Notification not found" }, { status: 404 });
        }

        await prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating notification:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
