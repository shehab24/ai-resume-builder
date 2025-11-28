import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const {
            sourceId,
            title,
            company,
            location,
            description,
            requirements,
            externalUrl,
            applicationMethod,
            applicationEmail,
            salary,
            jobType,
            workMode,
        } = await req.json();

        if (!sourceId || !title || !company || !description || !requirements) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Create job with external flag
        const job = await prisma.job.create({
            data: {
                recruiterId: user.id, // Admin is the "recruiter" for external jobs
                title,
                company,
                location: location || null,
                description,
                requirements,

                // External job fields
                isExternal: true,
                sourceId,
                externalUrl: externalUrl || null,
                applicationMethod,
                applicationEmail: applicationEmail || null,

                // Optional fields
                salary: salary || null,
                jobType: jobType || null,
                workMode: workMode || null,

                // Empty tasks for external jobs
                tasks: [],
            },
        });

        // Update source's lastScrapedAt
        await prisma.jobSource.update({
            where: { id: sourceId },
            data: { lastScrapedAt: new Date() }
        });

        return NextResponse.json(job, { status: 201 });
    } catch (error) {
        console.error("Error importing job:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
