import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET — Dashboard fetches its full queue history
export async function GET(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
        if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status"); // optional filter

        const where: Record<string, unknown> = { userId: user.id };
        if (status) where.status = status;

        // Auto-reset jobs stuck in PROCESSING for more than 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        await prisma.extensionQueue.updateMany({
            where: {
                userId: user.id,
                status: "PROCESSING",
                queuedAt: { lt: fiveMinutesAgo }
            },
            data: {
                status: "PENDING",
                notes: "Resetting hung/stuck application processor"
            }
        });

        const entries = await prisma.extensionQueue.findMany({
            where,
            orderBy: { queuedAt: "desc" },
            take: 100,
        });

        return NextResponse.json(entries);
    } catch (err) {
        console.error("[queue/history GET]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
