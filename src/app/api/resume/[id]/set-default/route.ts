import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find the local user ID based on Clerk ID
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: user.id },
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // First, unset all resumes as default for this user
        await prisma.resume.updateMany({
            where: { userId: dbUser.id },
            data: { isDefault: false },
        });

        // Then set the selected resume as default
        const resume = await prisma.resume.update({
            where: {
                id: id,
                userId: dbUser.id, // Ensure user owns this resume
            },
            data: { isDefault: true },
        });

        return NextResponse.json({ success: true, resume });
    } catch (error) {
        console.error("Error setting default resume:", error);
        return NextResponse.json(
            { error: "Failed to set default resume" },
            { status: 500 }
        );
    }
}
