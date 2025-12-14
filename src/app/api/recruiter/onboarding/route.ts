import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { companyName, companyEmail, website, size, description, emailVerified } = body;

        if (!companyName || !companyEmail || !website) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { clerkId: user.id },
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Update user with recruiter info and set status to PENDING
        // Keep role as JOB_SEEKER until admin approves
        const updatedUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: {
                recruiterStatus: "PENDING",
                companyInfo: {
                    companyName,
                    companyEmail,
                    emailVerified: emailVerified || false,
                    website,
                    size,
                    description,
                    submittedAt: new Date().toISOString()
                }
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });

    } catch (error) {
        console.error("Error submitting recruiter application:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
