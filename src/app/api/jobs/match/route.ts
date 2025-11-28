import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Fetch all jobs EXCEPT those posted by the current user
        // This prevents users from seeing their own job postings when they switch to job seeker role
        const jobs = await prisma.job.findMany({
            where: {
                recruiterId: {
                    not: user.id // Exclude jobs posted by this user
                }
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(jobs);
    } catch (error) {
        console.error("Error fetching jobs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
