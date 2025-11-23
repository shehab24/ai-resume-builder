import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const resume = await prisma.resume.findFirst({
            where: {
                id,
                user: {
                    clerkId: user.id,
                },
            },
        });

        if (!resume) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }

        return NextResponse.json(resume);
    } catch (error) {
        console.error("Error fetching resume:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
