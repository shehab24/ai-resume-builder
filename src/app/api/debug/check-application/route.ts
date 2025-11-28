import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

        const existingApplication = await prisma.application.findFirst({
            where: {
                userId: user.id,
                jobId: job.id
            }
        });

        return NextResponse.json({
            user: user.email,
            job: job.title,
            hasExistingApplication: !!existingApplication,
            applicationId: existingApplication?.id || null
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
