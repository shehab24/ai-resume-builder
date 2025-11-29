import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

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

        const {
            interviewMarks,
            technicalMarks,
            behavioralMarks,
            salaryDiscussed,
            benefits,
            startDate,
            keyTopics,
            interviewNotes
        } = body;

        // Verify user has access to this interview
        const interview = await prisma.interview.findUnique({
            where: { id },
            include: {
                application: {
                    include: {
                        job: true
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

        // Update interview notes
        const updatedInterview = await prisma.interview.update({
            where: { id },
            data: {
                interviewMarks,
                technicalMarks,
                behavioralMarks,
                salaryDiscussed,
                benefits,
                startDate,
                keyTopics,
                interviewNotes
            }
        });

        return NextResponse.json(updatedInterview);
    } catch (error) {
        console.error("Error updating interview notes:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
