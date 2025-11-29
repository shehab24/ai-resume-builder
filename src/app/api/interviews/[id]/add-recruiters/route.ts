import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { recruiterIds } = body;

        if (!recruiterIds || !Array.isArray(recruiterIds) || recruiterIds.length === 0) {
            return NextResponse.json(
                { error: "Recruiter IDs are required" },
                { status: 400 }
            );
        }

        // Verify the interview exists
        const interview = await prisma.interview.findUnique({
            where: { id },
            include: {
                application: {
                    include: {
                        job: true
                    }
                },
                participants: true
            }
        });

        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        // Verify user is the primary recruiter or already a panel member
        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isParticipant = interview.participants.some(p => p.userId === user.id);
        if (!isParticipant) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Add new panel members
        const addedRecruiters = [];
        for (const recruiterId of recruiterIds) {
            // Check if already a participant
            const exists = interview.participants.some(p => p.userId === recruiterId);
            if (exists) {
                continue; // Skip if already added
            }

            // Verify the user exists and is a recruiter
            const recruiterUser = await prisma.user.findUnique({
                where: { id: recruiterId }
            });

            if (!recruiterUser) {
                console.warn(`User ${recruiterId} not found, skipping`);
                continue;
            }

            if (recruiterUser.role !== 'RECRUITER') {
                console.warn(`User ${recruiterId} is not a recruiter (role: ${recruiterUser.role}), skipping`);
                continue; // Skip non-recruiters
            }

            // Add as panel recruiter
            await prisma.interviewParticipant.create({
                data: {
                    interviewId: interview.id,
                    userId: recruiterId,
                    role: 'PANEL_RECRUITER'
                }
            });

            // Send notification
            await prisma.notification.create({
                data: {
                    userId: recruiterId,
                    title: "Added to Interview Panel",
                    message: `You've been added to an interview panel for ${interview.application.job.title} on ${new Date(interview.scheduledAt).toLocaleString()}`,
                    type: "INTERVIEW",
                    link: `/dashboard/recruiter/interviews`
                }
            });

            addedRecruiters.push(recruiterId);
        }

        return NextResponse.json({
            success: true,
            addedCount: addedRecruiters.length,
            message: `Added ${addedRecruiters.length} recruiter(s) to the interview panel`
        });
    } catch (error) {
        console.error("Error adding recruiters to interview:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
