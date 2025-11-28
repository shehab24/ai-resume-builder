import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const jobs = await prisma.job.findMany({
            select: {
                id: true,
                title: true,
                location: true,
                requirements: true,
                applicationDeadline: true,
                createdAt: true
            }
        });

        const seekers = await prisma.user.findMany({
            where: {
                role: "JOB_SEEKER",
                autoApply: true
            },
            select: {
                email: true,
                autoApply: true,
                matchThreshold: true,
                autoApplyCountry: true
            }
        });

        return NextResponse.json({
            jobs,
            seekers
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
