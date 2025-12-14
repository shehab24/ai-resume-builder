import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function POST() {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Reset user back to JOB_SEEKER and clear recruiter status
        const updatedUser = await prisma.user.update({
            where: { clerkId: user.id },
            data: {
                role: "JOB_SEEKER",
                recruiterStatus: "NONE",
                companyInfo: null
            }
        });

        return NextResponse.json({
            success: true,
            message: "Account reset to Job Seeker",
            user: updatedUser
        });

    } catch (error) {
        console.error("Error resetting account:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
