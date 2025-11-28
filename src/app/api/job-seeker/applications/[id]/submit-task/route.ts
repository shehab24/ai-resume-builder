import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { id } = await params;
        const body = await req.json();
        const { submission } = body;

        // Verify ownership
        const application = await prisma.application.findUnique({
            where: { id },
        });

        if (!application || application.userId !== user.id) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        // Add submission to taskSubmissions array
        const updatedApplication = await prisma.application.update({
            where: { id },
            data: {
                taskSubmissions: [...application.taskSubmissions, submission],
            },
        });

        // Fetch job and resume for AI evaluation
        const job = await prisma.job.findUnique({
            where: { id: application.jobId }
        });

        const resume = await prisma.resume.findFirst({
            where: { userId: user.id, isDefault: true }
        });

        if (job && resume) {
            console.log("✓ Job and Resume found, triggering AI evaluation...");
            console.log("  - Job ID:", job.id);
            console.log("  - Resume ID:", resume.id);
            console.log("  - Task:", job.tasks?.[0] || "No task specified");

            // Trigger AI evaluation (async, don't wait for it)
            evaluateAndScore(application.id, job, resume, submission).catch(err => {
                console.error("❌ AI Evaluation failed:", err);
                console.error("   Error details:", err.message);
            });
        } else {
            console.log("❌ Missing job or resume:");
            console.log("  - Job found:", !!job);
            console.log("  - Resume found:", !!resume);
        }

        return NextResponse.json(updatedApplication);
    } catch (error) {
        console.error("Error submitting task:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Helper function to evaluate task and update scores
async function evaluateAndScore(applicationId: string, job: any, resume: any, submission: string) {
    console.log("🤖 Starting AI evaluation for application:", applicationId);

    try {
        console.log("  → Calling AI evaluation API...");

        // Call AI evaluation API
        const evalResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/evaluate-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                taskDescription: job.tasks?.[0] || "Complete the assigned task",
                taskSubmission: submission,
                jobRequirements: job.requirements,
                resumeContent: JSON.parse(resume.content)
            })
        });

        console.log("  → AI API response status:", evalResponse.status);

        if (!evalResponse.ok) {
            const errorText = await evalResponse.text();
            console.error("  ❌ AI API error:", errorText);
            throw new Error("AI evaluation failed");
        }

        const { evaluation } = await evalResponse.json();
        console.log("  ✓ AI Evaluation received. Score:", evaluation.score);

        const taskScore = evaluation.score || 0;

        // Calculate resume score (reuse existing matching logic)
        const resumeData = JSON.parse(resume.content);
        const resumeScore = calculateResumeScore(resumeData, job.requirements);

        // Calculate composite score (40% resume + 60% task)
        const compositeScore = Math.round(resumeScore * 0.4 + taskScore * 0.6);

        // Update application with scores
        await prisma.application.update({
            where: { id: applicationId },
            data: {
                resumeScore,
                taskScore,
                compositeScore,
                aiEvaluation: JSON.stringify(evaluation)
            }
        });

        // Update top candidates ranking for this job
        await updateTopCandidates(job.id);

    } catch (error) {
        console.error("Error in evaluateAndScore:", error);
    }
}

// Helper to calculate resume match score
function calculateResumeScore(resume: any, requirements: string[]): number {
    if (!requirements || requirements.length === 0) return 100;

    const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();

    const rawResumeText = [
        ...(resume.skills || []),
        ...(resume.experience?.map((e: any) => `${e.position} ${e.company} ${e.description}`) || []),
        resume.summary || "",
        resume.education?.map((e: any) => `${e.degree} ${e.school}`) || []
    ].join(" ");

    const normalizedResumeText = normalize(rawResumeText);
    const jobRequirements = requirements.map(r => normalize(r));

    let matchCount = 0;
    for (const req of jobRequirements) {
        if (normalizedResumeText.includes(req)) {
            matchCount++;
        } else if (req.endsWith(" js") && normalizedResumeText.includes(req.replace(" js", ""))) {
            matchCount++;
        }
    }

    return Math.round((matchCount / jobRequirements.length) * 100);
}

// Helper to mark top 10 candidates for a job
async function updateTopCandidates(jobId: string) {
    // Get all applications for this job, sorted by composite score
    const applications = await prisma.application.findMany({
        where: { jobId },
        orderBy: { compositeScore: 'desc' }
    });

    // Mark top 10 as top candidates
    for (let i = 0; i < applications.length; i++) {
        await prisma.application.update({
            where: { id: applications[i].id },
            data: { isTopCandidate: i < 10 }
        });
    }
}
