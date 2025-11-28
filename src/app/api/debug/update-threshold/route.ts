import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const email = "marcus.hayden4845@gmail.com";

        const user = await prisma.user.update({
            where: { email },
            data: {
                matchThreshold: 75 // Lower threshold to allow 4/5 matches (80%)
            }
        });

        return NextResponse.json({
            success: true,
            user: user.email,
            newThreshold: user.matchThreshold
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
