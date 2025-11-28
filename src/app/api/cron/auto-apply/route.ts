import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to calculate job match score
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
    for (const req of jobRequirements) {
        // 1. Exact phrase match (normalized)
        if (normalizedResumeText.includes(req)) {
            matchCount++;
        }
        // 2. Fallback: "React js" -> match "React"
        else if (req.endsWith(" js") && normalizedResumeText.includes(req.replace(" js", ""))) {
            matchCount++;
        }
        // 3. Fallback: "Node.js" normalized to "node js" -> match "node"
        else if (req === "node js" && normalizedResumeText.includes("node")) {
            matchCount++;
        }
    }

    return Math.round((matchCount / jobRequirements.length) * 100);
}

export async function GET(req: Request) {
    try {
        // Secure this endpoint with a secret key if needed (e.g., CRON_SECRET)
        // const authHeader = req.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return new Response('Unauthorized', { status: 401 });
        // }

        console.log("Starting Auto-Apply Cron Job...");

        // 1. Fetch recent jobs (e.g., last 24 hours) that are still open
        // In a real system, we'd track which jobs have been processed for auto-apply
        const recentJobs = await prisma.job.findMany({
            where: {
                // createdAt: {
                //     gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                // },
                OR: [
                    { applicationDeadline: { gte: new Date() } },
                    { applicationDeadline: null }
                ]
            },
            include: {
                recruiter: true
            }
        });

        console.log(`Found ${recentJobs.length} recent jobs.`);

        // 2. Fetch Job Seekers with Auto-Apply enabled
        const autoApplySeekers = await prisma.user.findMany({
            where: {
                role: "JOB_SEEKER",
                autoApply: true,
                isBlocked: false
            }
        });

        console.log(`Found ${autoApplySeekers.length} auto-apply seekers.`);

        let applicationsCreated = 0;

        // 3. Process matching
        for (const job of recentJobs) {
            for (const seeker of autoApplySeekers) {
                // Country Matching Logic
                if (seeker.autoApplyCountry) {
                    const userCountry = seeker.autoApplyCountry.toLowerCase();
                    const jobCountry = job.country?.toLowerCase();
                    const jobLocation = job.location?.toLowerCase();

                    // 1. If job is explicitly Worldwide/Remote (via country field), allow it.
                    if (jobCountry === "worldwide" || jobCountry === "remote") {
                        // Allow
                    }
                    // 2. If job has a specific country, it MUST match user's country.
                    else if (jobCountry) {
                        if (jobCountry !== userCountry) continue;
                    }
                    // 3. Fallback: If no job country field, check location string (legacy)
                    else if (jobLocation) {
                        if (!jobLocation.includes(userCountry)) continue;
                    }
                    // 4. If no location info at all, maybe skip to be safe? Or allow?
                    // Let's skip to be safe if user has a preference.
                    else {
                        continue;
                    }
                }

                // Check if already applied
                const existingApplication = await prisma.application.findFirst({
                    where: {
                        userId: seeker.id,
                        jobId: job.id
                    }
                });

                if (existingApplication) continue;

                // Get seeker's default resume
                const resume = await prisma.resume.findFirst({
                    where: { userId: seeker.id, isDefault: true }
                }) || await prisma.resume.findFirst({
                    where: { userId: seeker.id } // Fallback to any resume
                });

                if (!resume) continue;

                let resumeData;
                try {
                    resumeData = JSON.parse(resume.content);
                } catch (e) {
                    continue;
                }

                // Calculate Match
                const matchScore = calculateMatchScore(resumeData, job.requirements);
                const threshold = seeker.matchThreshold || 95;

                console.log(`Checking ${seeker.email} for ${job.title}: Score=${matchScore}%, Threshold=${threshold}%`);

                if (matchScore >= threshold) {
                    console.log(`✓ Match! Creating application for ${seeker.email} to ${job.title}`);

                    // Apply!
                    const application = await prisma.application.create({
                        data: {
                            userId: seeker.id,
                            jobId: job.id,
                            status: "PENDING",
                            taskSubmissions: []
                        }
                    });

                    applicationsCreated++;

                    // Notify Seeker
                    await prisma.notification.create({
                        data: {
                            userId: seeker.id,
                            title: "Auto-Applied to Job! 🚀",
                            message: `We automatically applied to "${job.title}" at ${job.company} (${matchScore}% match)`,
                            type: "STATUS_UPDATE",
                            link: `/dashboard/job-seeker/applications`
                        }
                    });

                    // Notify Recruiter
                    await prisma.notification.create({
                        data: {
                            userId: job.recruiterId,
                            title: "New Application Received",
                            message: `${seeker.name || "A candidate"} applied to ${job.title} (Auto-Applied)`,
                            type: "APPLICATION_RECEIVED",
                            link: `/dashboard/recruiter/applications/${application.id}`
                        }
                    });
                } else {
                    console.log(`✗ No match. Score ${matchScore}% < Threshold ${threshold}%`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            jobsProcessed: recentJobs.length,
            seekersProcessed: autoApplySeekers.length,
            applicationsCreated
        });

    } catch (error) {
        console.error("Cron Job Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
