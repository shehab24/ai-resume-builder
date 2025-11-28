import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
        const { action, duration, reason } = body; // action: "WARN" | "BLOCK" | "UNBLOCK"

        const { id: targetUserId } = await params;

        if (action === "WARN") {
            // Increment warning count and send notification
            await prisma.$transaction([
                prisma.user.update({
                    where: { id: targetUserId },
                    data: { warningCount: { increment: 1 } },
                }),
                prisma.notification.create({
                    data: {
                        userId: targetUserId,
                        title: "Warning Issued",
                        message: reason || "You have received a warning for violating community guidelines.",
                        type: "WARNING",
                    },
                }),
            ]);
            return NextResponse.json({ message: "User warned successfully" });
        }

        if (action === "BLOCK") {
            // Block user until specific date
            let blockedUntil = null;
            if (duration === "PERMANENT") {
                blockedUntil = new Date("2099-12-31"); // Effectively permanent
            } else {
                const days = parseInt(duration);
                if (!isNaN(days)) {
                    blockedUntil = new Date();
                    blockedUntil.setDate(blockedUntil.getDate() + days);
                }
            }

            await prisma.user.update({
                where: { id: targetUserId },
                data: {
                    isBlocked: true,
                    blockedUntil: blockedUntil,
                },
            });

            // Notify user via email (mocked here by notification, but they might be blocked from seeing it)
            // Ideally send an email via Clerk or external service.

            return NextResponse.json({ message: "User blocked successfully" });
        }

        if (action === "UNBLOCK") {
            await prisma.user.update({
                where: { id: targetUserId },
                data: {
                    isBlocked: false,
                    blockedUntil: null,
                },
            });
            return NextResponse.json({ message: "User unblocked successfully" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Error in moderation:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
