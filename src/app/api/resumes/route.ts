import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find the local user ID based on Clerk ID
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: user.id },
        });

        console.log("API /resumes: Clerk User ID:", user.id);

        if (!dbUser) {
            console.log("API /resumes: User not found in DB");
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        console.log("API /resumes: DB User ID:", dbUser.id);

        // Fetch all resumes for this user
        const resumes = await prisma.resume.findMany({
            where: { userId: dbUser.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                isDefault: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        console.log("API /resumes: Found resumes:", resumes.length);

        return NextResponse.json({ resumes });
    } catch (error) {
        console.error("Error fetching resumes:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
