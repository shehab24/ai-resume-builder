import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });
        if (!dbUser || dbUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { userId } = body;
        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true },
        });
        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Use raw MongoDB command to bypass Prisma enum type cache
        await prisma.$runCommandRaw({
            update: "User",
            updates: [
                {
                    q: { _id: { $oid: userId } },
                    u: {
                        $set: {
                            recruiterStatus: "BLOCKED",
                            role: "JOB_SEEKER",
                        },
                        $currentDate: { updatedAt: true },
                    },
                },
            ],
        });

        return NextResponse.json({ success: true, message: `${targetUser.email} blocked from recruiter role` });
    } catch (error) {
        console.error("Error blocking recruiter:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}
