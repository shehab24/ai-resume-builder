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

        const { id: jobId } = await params;

        // Verify the job belongs to this recruiter
        const job = await prisma.job.findUnique({
            where: { id: jobId },
        });

        if (!job || job.recruiterId !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Get all applications for this job with scores
        const applications = await prisma.application.findMany({
            where: {
                jobId,
                compositeScore: { not: null } // Only include scored applications
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        photoUrl: true,
                    },
                },
            },
            orderBy: {
                compositeScore: 'desc'
            }
        });

        // Parse AI evaluations and add ranking
        const rankedCandidates = applications.map((app, index) => {
            let evaluation = null;
            try {
                evaluation = app.aiEvaluation ? JSON.parse(app.aiEvaluation) : null;
            } catch (e) {
                console.error("Failed to parse AI evaluation:", e);
            }

            return {
                id: app.id,
                rank: index + 1,
                user: app.user,
                status: app.status,
                createdAt: app.createdAt,
                resumeScore: app.resumeScore,
                taskScore: app.taskScore,
                compositeScore: app.compositeScore,
                evaluation: evaluation,
                taskSubmissions: app.taskSubmissions,
            };
        });

        // Get top 10 candidates
        const topCandidates = rankedCandidates.slice(0, 10);

        // Calculate statistics
        const stats = {
            totalApplicants: applications.length,
            averageScore: applications.reduce((sum, app) => sum + (app.compositeScore || 0), 0) / applications.length || 0,
            topScore: rankedCandidates[0]?.compositeScore || 0,
            shortlisted: applications.filter(app => app.status === 'SHORTLISTED').length,
            interviewed: applications.filter(app => app.status === 'INTERVIEW').length,
        };

        return NextResponse.json({
            job: {
                id: job.id,
                title: job.title,
                company: job.company,
            },
            candidates: topCandidates,
            allCandidates: rankedCandidates,
            stats
        });
    } catch (error) {
        console.error("Error fetching top candidates:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
