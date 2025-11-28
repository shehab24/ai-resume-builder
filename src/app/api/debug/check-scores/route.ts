import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        // Get recent applications with scores
        const applications = await prisma.application.findMany({
            take: 10,
            orderBy: { updatedAt: 'desc' },
            include: {
                user: {
                    select: { email: true }
                },
                job: {
                    select: { title: true }
                }
            }
        });

        return NextResponse.json({ applications });
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
