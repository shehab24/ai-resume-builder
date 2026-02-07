import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createVideoCall } from "@/lib/stream";

// POST - Schedule a new interview
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { applicationId, scheduledAt, duration, panelRecruiterIds = [] } = body;

        if (!applicationId || !scheduledAt) {
            return NextResponse.json(
                { error: "Application ID and scheduled time are required" },
                { status: 400 }
            );
        }

        // Verify the application exists and user is the recruiter
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                job: {
                    include: {
                        recruiter: true
                    }
                },
                user: true
            }
        });

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        if (application.job.recruiter.clerkId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Generate unique call ID
        const streamCallId = `interview-${applicationId}-${Date.now()}`;

        // Create Stream video call
        await createVideoCall(streamCallId, userId);

        // Create interview record
        const interview = await prisma.interview.create({
            data: {
                applicationId,
                scheduledAt: new Date(scheduledAt),
                duration: duration || 60,
                streamCallId,
                status: "SCHEDULED"
            },
            include: {
                application: {
                    include: {
                        user: true,
                        job: true
                    }
                }
            }
        });

        // Create participants
        // 1. Primary recruiter
        await prisma.interviewParticipant.create({
            data: {
                interviewId: interview.id,
                userId: application.job.recruiterId,
                role: 'PRIMARY_RECRUITER'
            }
        });

        // 2. Panel recruiters
        for (const panelRecruiterId of panelRecruiterIds) {
            await prisma.interviewParticipant.create({
                data: {
                    interviewId: interview.id,
                    userId: panelRecruiterId,
                    role: 'PANEL_RECRUITER'
                }
            });

            // Send notification to panel member
            await prisma.notification.create({
                data: {
                    userId: panelRecruiterId,
                    title: "Added to Interview Panel",
                    message: `You've been added to an interview panel for ${application.job.title} on ${new Date(scheduledAt).toLocaleString()}`,
                    type: "INTERVIEW",
                    link: `/dashboard/recruiter/interviews/${interview.id}`
                }
            });
        }

        // 3. Candidate
        await prisma.interviewParticipant.create({
            data: {
                interviewId: interview.id,
                userId: application.userId,
                role: 'CANDIDATE'
            }
        });

        // Create notification for job seeker
        await prisma.notification.create({
            data: {
                userId: application.userId,
                title: "Interview Scheduled",
                message: `You have been invited to an interview for ${application.job.title} on ${new Date(scheduledAt).toLocaleString()}`,
                type: "INTERVIEW",
                link: `/dashboard/job-seeker/interviews/${interview.id}`
            }
        });

        return NextResponse.json(interview);
    } catch (error) {
        console.error("Error scheduling interview:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// GET - List interviews (for recruiter or job seeker)
export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let interviews;

        if (user.role === "RECRUITER") {
            // Get interviews for jobs posted by this recruiter
            interviews = await prisma.interview.findMany({
                where: {
                    application: {
                        job: {
                            recruiterId: user.id
                        }
                    }
                },
                include: {
                    application: {
                        include: {
                            user: true,
                            job: true
                        }
                    },
                    participants: {
                        include: {
                            user: true
                        }
                    }
                },
                orderBy: { scheduledAt: "asc" }
            });
        } else {
            // Get interviews for this job seeker's applications
            interviews = await prisma.interview.findMany({
                where: {
                    application: {
                        userId: user.id
                    }
                },
                include: {
                    application: {
                        include: {
                            job: {
                                include: {
                                    recruiter: true
                                }
                            }
                        }
                    }
                },
                orderBy: { scheduledAt: "asc" }
            });
        }

        return NextResponse.json(interviews);
    } catch (error) {
        console.error("Error fetching interviews:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
