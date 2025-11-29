import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { generateStreamToken, STREAM_API_KEY } from "@/lib/stream";

// GET - Get Stream token for joining video call
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const interview = await prisma.interview.findUnique({
            where: { id },
            include: {
                application: {
                    include: {
                        user: true,
                        job: {
                            include: {
                                recruiter: true
                            }
                        }
                    }
                }
            }
        });

        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isRecruiter = interview.application.job.recruiterId === user.id;
        const isJobSeeker = interview.application.userId === user.id;

        if (!isRecruiter && !isJobSeeker) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Check if interview is accepted or scheduled
        if (interview.status !== "SCHEDULED" && interview.status !== "ACCEPTED") {
            return NextResponse.json(
                { error: "Interview is not available for joining" },
                { status: 400 }
            );
        }

        // Get current user details from Clerk
        const clerkUser = await currentUser();
        const userName = clerkUser?.firstName && clerkUser?.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : user.name || "User";

        // Generate Stream token
        const token = await generateStreamToken(userId, userName);

        // Update join status
        const updateData: any = {};
        if (isRecruiter) {
            updateData.recruiterJoined = true;
        } else {
            updateData.seekerJoined = true;
        }

        // If both joined, mark as in progress
        if (interview.recruiterJoined || interview.seekerJoined) {
            updateData.status = "ACCEPTED";
        }

        await prisma.interview.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({
            token,
            apiKey: STREAM_API_KEY,
            callId: interview.streamCallId,
            userId: userId,
            userName: userName
        });
    } catch (error) {
        console.error("Error generating token:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
