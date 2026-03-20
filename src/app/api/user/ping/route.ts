import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ ok: false }, { status: 401 });
        }

        await prisma.user.update({
            where: { clerkId: userId },
            data: { lastSeenAt: new Date() } as any,
        });

        return NextResponse.json({ ok: true });
    } catch {
        // Silent fail — never block the user experience due to a ping error
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
