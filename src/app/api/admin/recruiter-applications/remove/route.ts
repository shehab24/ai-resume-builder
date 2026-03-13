import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins can remove
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: user.id },
        });

        if (!dbUser || dbUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        // Verify the target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true, recruiterStatus: true },
        });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Permanently remove from recruiter list:
        // Reset role → JOB_SEEKER, recruiterStatus → NONE, clear companyInfo
        // Using prisma.$runCommandRaw to bypass enum type cache issues
        await prisma.$runCommandRaw({
            update: "User",
            updates: [
                {
                    q: { _id: { $oid: userId } },
                    u: {
                        $set: {
                            role: "JOB_SEEKER",
                            recruiterStatus: "NONE",
                            companyInfo: null,
                        },
                        $currentDate: { updatedAt: true },
                    },
                },
            ],
        });

        return NextResponse.json({
            success: true,
            message: `${targetUser.email} permanently removed from recruiter list`,
        });
    } catch (error) {
        console.error("Error removing from recruiter list:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}
