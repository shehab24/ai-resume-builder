import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
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

        // Get all recruiter applications
        const applications = await prisma.user.findMany({
            where: {
                recruiterStatus: {
                    in: ["PENDING", "APPROVED", "REJECTED"]
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                recruiterStatus: true,
                companyInfo: true,
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        return NextResponse.json({ applications });

    } catch (error) {
        console.error("Error fetching applications:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
