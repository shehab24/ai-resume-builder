import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function calculateMatchScore(resume: any, requirements: string[]): number {
    if (!requirements || requirements.length === 0) return 100;

    // Helper to normalize text: lowercase, remove special chars, normalize spaces
    const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();

    // Combine all resume text for searching
    const rawResumeText = [
        ...(resume.skills || []),
        ...(resume.experience?.map((e: any) => `${e.position} ${e.company} ${e.description}`) || []),
        resume.summary || "",
        resume.education?.map((e: any) => `${e.degree} ${e.school}`) || []
    ].join(" ");

    const normalizedResumeText = normalize(rawResumeText);
    const jobRequirements = requirements.map(r => normalize(r));

    let matchCount = 0;
    const matches = [];
    const misses = [];

    for (const req of jobRequirements) {
        if (normalizedResumeText.includes(req)) {
            matchCount++;
            matches.push(req);
        } else {
            misses.push(req);
        }
    }

    return Math.round((matchCount / jobRequirements.length) * 100);
}

export async function GET(req: Request) {
    try {
        const email = "marcus.hayden4845@gmail.com";
        const jobTitle = "Software Engineer";

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) return NextResponse.json({ error: "User not found" });

        const job = await prisma.job.findFirst({
            where: { title: jobTitle }
        });

        if (!job) return NextResponse.json({ error: "Job not found" });

        const resume = await prisma.resume.findFirst({
            where: { userId: user.id, isDefault: true }
        }) || await prisma.resume.findFirst({
            where: { userId: user.id }
        });

        if (!resume) return NextResponse.json({ error: "Resume not found" });

        const resumeData = JSON.parse(resume.content);
        const score = calculateMatchScore(resumeData, job.requirements);

        return NextResponse.json({
            user: user.email,
            autoApplyEnabled: user.autoApply,
            threshold: user.matchThreshold,
            job: job.title,
            requirements: job.requirements,
            resumeSkills: resumeData.skills,
            matchScore: score,
            willApply: score >= (user.matchThreshold || 95)
        });

    } catch (error) {
        return NextResponse.json({ error: (error as any).message });
    }
}
