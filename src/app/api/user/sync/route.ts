import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get full user details from Clerk
        const clerkUser = await currentUser();
        if (!clerkUser) {
            return NextResponse.json({ error: "User not found in Clerk" }, { status: 404 });
        }

        // Check if user already exists in database
        let user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            // Create user in database
            user = await prisma.user.create({
                data: {
                    clerkId: userId,
                    email: clerkUser.emailAddresses[0]?.emailAddress || "",
                    name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
                    photoUrl: clerkUser.imageUrl || null,
                    role: "JOB_SEEKER", // Default role
                },
            });
            console.log("Created user in database:", user.email);
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            }
        });
    } catch (error) {
        console.error("Error syncing user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
