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
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;

        const application = await prisma.application.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        resumes: {
                            take: 1,
                            orderBy: [
                                { isDefault: 'desc' },
                                { createdAt: 'desc' }
                            ]
                        }
                    }
                },
                job: {
                    select: {
                        title: true,
                        company: true
                    }
                }
            },
        });

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        return NextResponse.json(application);
    } catch (error) {
        console.error("Error fetching application:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
