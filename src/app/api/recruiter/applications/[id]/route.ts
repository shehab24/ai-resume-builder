import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user || user.role !== "RECRUITER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;

        const application = await prisma.application.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        photoUrl: true,
                    },
                },
                job: {
                    select: {
                        title: true,
                        tasks: true,
                        recruiterId: true
                    }
                }
            },
        });

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        // Fetch the user's default resume
        const resume = await prisma.resume.findFirst({
            where: {
                userId: application.userId,
                isDefault: true
            }
        });

        // Verify the application belongs to a job posted by this recruiter
        if (application.job.recruiterId !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        return NextResponse.json({
            application: {
                ...application,
                resumeContent: resume ? JSON.parse(resume.content) : null
            }
        });
    } catch (error) {
        console.error("Error fetching application:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
