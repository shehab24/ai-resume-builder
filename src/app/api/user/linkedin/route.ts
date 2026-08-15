import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Bypasses Prisma Schema validation using MongoDB native command
        const result = await prisma.$runCommandRaw({
            find: "User",
            filter: { clerkId: userId },
            limit: 1
        }) as any;

        const userDoc = result?.cursor?.firstBatch?.[0];
        if (!userDoc) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const linkedinConnectedAt = userDoc.linkedinConnectedAt?.$date || userDoc.linkedinConnectedAt || null;

        return NextResponse.json({
            linkedinProfileUrl: userDoc.linkedinProfileUrl ?? null,
            linkedinConnectedAt: linkedinConnectedAt,
            connected: !!userDoc.linkedinProfileUrl,
        });
    } catch (error) {
        console.error("LinkedIn GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { linkedinProfileUrl } = await req.json();

        if (!linkedinProfileUrl || !linkedinProfileUrl.includes("linkedin.com")) {
            return NextResponse.json({ error: "Please enter a valid LinkedIn profile URL" }, { status: 400 });
        }

        // Normalise URL — strip trailing slash, force https
        const clean = linkedinProfileUrl.trim().replace(/\/$/, "").replace(/^http:/, "https:");
        const now = new Date();

        // Bypasses Prisma Schema validation using MongoDB native command
        await prisma.$runCommandRaw({
            findAndModify: "User",
            query: { clerkId: userId },
            update: {
                $set: {
                    linkedinProfileUrl: clean,
                    linkedinConnectedAt: { $date: now.toISOString() }
                }
            },
            new: true
        });

        return NextResponse.json({
            success: true,
            linkedinProfileUrl: clean,
            linkedinConnectedAt: now.toISOString()
        });
    } catch (error) {
        console.error("LinkedIn POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Bypasses Prisma Schema validation using MongoDB native command
        await prisma.$runCommandRaw({
            findAndModify: "User",
            query: { clerkId: userId },
            update: {
                $unset: {
                    linkedinProfileUrl: "",
                    linkedinConnectedAt: ""
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("LinkedIn DELETE error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
