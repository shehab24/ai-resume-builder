import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// Helper function to calculate job match score
function calculateMatchScore(resume: { skills: string[]; experience: string[] }, requirements: string[]): number {
    if (!requirements || requirements.length === 0) return 100;
    if (!resume.skills || resume.skills.length === 0) return 0;

    const resumeSkills = resume.skills.map(s => s.toLowerCase());
    const jobRequirements = requirements.map(r => r.toLowerCase());

    let matchCount = 0;
    for (const req of jobRequirements) {
        if (resumeSkills.some(skill => skill.includes(req) || req.includes(skill))) {
            matchCount++;
        }
    }

    return Math.round((matchCount / jobRequirements.length) * 100);
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user || user.role !== "RECRUITER") {
            return NextResponse.json({ error: "Unauthorized: Recruiter role required" }, { status: 403 });
        }

        const body = await req.json();
        const {
            title,
            company,
            description,
            location,
            jobType,
            workMode,
            experienceLevel,
            salaryMin,
            salaryMax,
            requirements,
            benefits,
            applicationDeadline,
            tasks,
        } = body;

        const job = await prisma.job.create({
            data: {
                recruiterId: user.id,
                title,
                company,
                description,
                location,
                jobType,
                workMode,
                experienceLevel,
                salaryMin,
                salaryMax,
                requirements,
                benefits: benefits || [],
                applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
                tasks: tasks || [],
            },
        });

        // Notify all Job Seekers
        const jobSeekers = await prisma.user.findMany({
            where: { role: "JOB_SEEKER" },
            select: {
                id: true,
                autoApply: true,
                name: true,
                email: true
            }
        });

        if (jobSeekers.length > 0) {
            const notifications = jobSeekers.map((seeker: { id: string; autoApply: boolean; name: string | null; email: string }) => ({
                userId: seeker.id,
                title: "New Job Posted",
                message: `A new job "${title}" at ${company} has been posted.`,
                type: "JOB_POSTED",
                link: `/dashboard/job-seeker/jobs/${job.id}`
            }));

            await prisma.notification.createMany({
                data: notifications
            });
        }

        // Auto-Apply for eligible users
        const autoApplyUsers = jobSeekers.filter((seeker: { id: string; autoApply: boolean; name: string | null; email: string }) => seeker.autoApply);

        if (autoApplyUsers.length > 0) {
            console.log(`Processing auto-apply for ${autoApplyUsers.length} users...`);

            for (const seeker of autoApplyUsers) {
                try {
                    // Get user's resumes
                    const resumes = await prisma.resume.findMany({
                        where: { userId: seeker.id },
                        select: {
                            id: true,
                            skills: true,
                            experience: true
                        }
                    });

                    if (resumes.length === 0) continue;

                    // Use the first resume (or you could pick the best matching one)
                    const resume = resumes[0];

                    // Calculate match score
                    const matchScore = calculateMatchScore(resume, requirements);

                    // Auto-apply if match is 95% or higher
                    if (matchScore >= 95) {
                        // Check if already applied
                        const existingApplication = await prisma.application.findFirst({
                            where: {
                                userId: seeker.id,
                                jobId: job.id
                            }
                        });

                        if (!existingApplication) {
                            // Create auto-application
                            const application = await prisma.application.create({
                                data: {
                                    userId: seeker.id,
                                    jobId: job.id,
                                    resumeId: resume.id,
                                    status: "PENDING",
                                    taskSubmissions: []
                                }
                            });

                            // Notify user about auto-application
                            await prisma.notification.create({
                                data: {
                                    userId: seeker.id,
                                    title: "Auto-Applied to Job! 🚀",
                                    message: `We automatically applied to "${title}" at ${company} (${matchScore}% match)`,
                                    type: "STATUS_UPDATE",
                                    link: `/dashboard/job-seeker/applications`
                                }
                            });

                            // Notify recruiter about new application
                            await prisma.notification.create({
                                data: {
                                    userId: user.id,
                                    title: "New Application Received",
                                    message: `${seeker.name || seeker.email} applied to ${title} (Auto-Applied)`,
                                    type: "APPLICATION_RECEIVED",
                                    link: `/dashboard/recruiter/applications/${application.id}`
                                }
                            });

                            console.log(`Auto-applied for user ${seeker.email} with ${matchScore}% match`);
                        }
                    }
                } catch (error) {
                    console.error(`Error auto-applying for user ${seeker.id}:`, error);
                    // Continue with next user even if one fails
                }
            }
        }

        return NextResponse.json(job);
    } catch (error) {
        console.error("Error creating job:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
