import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ exists: false });
        }

        return NextResponse.json({ exists: true, role: user.role });
    } catch (error) {
        console.error("Error checking user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
