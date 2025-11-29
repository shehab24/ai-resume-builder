import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateStreamToken } from "@/lib/stream";

// GET - Get interview details
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
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                photoUrl: true
                            }
                        }
                    }
                }
            }
        });

        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        // Verify user has access to this interview
        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user is a participant
        const isParticipant = interview.participants.some(p => p.userId === user.id);

        if (!isParticipant) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Determine user's role in the interview
        const participant = interview.participants.find(p => p.userId === user.id);
        const isRecruiter = participant?.role === 'PRIMARY_RECRUITER' || participant?.role === 'PANEL_RECRUITER';
        const isJobSeeker = participant?.role === 'CANDIDATE';

        // Fallback: If application has no resumeContent, try to fetch user's default resume
        let responseData: any = { ...interview };

        if (!responseData.application.resumeContent) {
            const defaultResume = await prisma.resume.findFirst({
                where: {
                    userId: interview.application.userId,
                    isDefault: true
                }
            });

            if (defaultResume && defaultResume.content) {
                try {
                    // Parse if it's a string, otherwise use as is
                    const parsedContent = typeof defaultResume.content === 'string'
                        ? JSON.parse(defaultResume.content)
                        : defaultResume.content;

                    responseData.application.resumeContent = parsedContent;
                } catch (e) {
                    console.error("Failed to parse default resume content", e);
                }
            }
        }

        return NextResponse.json({ ...responseData, isRecruiter });
    } catch (error) {
        console.error("Error fetching interview:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH - Update interview status (accept/decline)
export async function PATCH(
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
        const { status, notes } = body;

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

        // Update interview
        const updateData: any = {};

        if (status) {
            updateData.status = status;
        }

        if (notes) {
            if (isRecruiter) {
                updateData.recruiterNotes = notes;
            } else {
                updateData.seekerNotes = notes;
            }
        }

        const updatedInterview = await prisma.interview.update({
            where: { id },
            data: updateData,
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

        // Send notification if status changed
        if (status === "ACCEPTED" && isJobSeeker) {
            await prisma.notification.create({
                data: {
                    userId: interview.application.job.recruiterId,
                    title: "Interview Accepted",
                    message: `${interview.application.user.name} has accepted the interview for ${interview.application.job.title}`,
                    type: "INTERVIEW",
                    link: `/dashboard/recruiter/interviews/${interview.id}`
                }
            });
        } else if (status === "DECLINED" && isJobSeeker) {
            await prisma.notification.create({
                data: {
                    userId: interview.application.job.recruiterId,
                    title: "Interview Declined",
                    message: `${interview.application.user.name} has declined the interview for ${interview.application.job.title}`,
                    type: "INTERVIEW",
                    link: `/dashboard/recruiter/applications/${interview.applicationId}`
                }
            });
        }

        return NextResponse.json(updatedInterview);
    } catch (error) {
        console.error("Error updating interview:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE - Cancel interview
export async function DELETE(
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

        // Only recruiter can cancel
        if (interview.application.job.recruiter.clerkId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.interview.update({
            where: { id },
            data: { status: "CANCELLED" }
        });

        // Notify job seeker
        await prisma.notification.create({
            data: {
                userId: interview.application.userId,
                title: "Interview Cancelled",
                message: `The interview for ${interview.application.job.title} has been cancelled`,
                type: "INTERVIEW",
                link: `/dashboard/job-seeker/applications`
            }
        });

        return NextResponse.json({ message: "Interview cancelled successfully" });
    } catch (error) {
        console.error("Error cancelling interview:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
