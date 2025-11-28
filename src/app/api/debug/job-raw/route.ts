import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const jobId = "692744d5d53a59ac0588d1d8";
        const job = await prisma.job.findUnique({
            where: { id: jobId }
        });

        return NextResponse.json({ job });
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
