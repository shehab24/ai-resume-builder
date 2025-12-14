import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
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

        // Reject the application
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                recruiterStatus: "REJECTED"
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });

    } catch (error) {
        console.error("Error rejecting application:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
