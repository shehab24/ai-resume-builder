import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

// Validate extension bearer token
async function validateToken(req: NextRequest) {
    const header = req.headers.get("authorization");
    if (!header?.startsWith("Bearer ")) return null;
    const hashed = crypto.createHash("sha256").update(header.slice(7).trim()).digest("hex");
    return prisma.user.findFirst({
        where: { extensionToken: hashed, extensionTokenExpiry: { gte: new Date() } },
        select: { id: true },
    });
}

// ── GET — Extension polls for PENDING jobs ────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const tokenUser = await validateToken(req);
        if (!tokenUser) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401, headers: CORS });
        }

        // Auto-reset jobs stuck in PROCESSING for more than 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        await prisma.extensionQueue.updateMany({
            where: {
                userId: tokenUser.id,
                status: "PROCESSING",
                queuedAt: { lt: fiveMinutesAgo }
            },
            data: {
                status: "PENDING",
                notes: "Resetting hung/stuck application processor"
            }
        });

        const jobs = await prisma.extensionQueue.findMany({
            where: { userId: tokenUser.id, status: "PENDING" },
            orderBy: { queuedAt: "asc" },
            take: 5, // Process max 5 at a time
        });

        return NextResponse.json(jobs, { headers: CORS });
    } catch (err) {
        console.error("[queue GET]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500, headers: CORS });
    }
}

// ── POST — Dashboard enqueues a job for the extension to apply ────────────────
export async function POST(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, extensionToken: true },
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (!user.extensionToken) {
            return NextResponse.json(
                { error: "Chrome extension not connected. Please install and connect the extension first." },
                { status: 400 }
            );
        }

        const body = await req.json();
        const { jobId, jobTitle, company, jobUrl, platform } = body;

        if (!jobUrl || !jobTitle) {
            return NextResponse.json({ error: "jobUrl and jobTitle are required" }, { status: 400 });
        }

        // Prevent duplicate queuing of the same job
        const existing = await prisma.extensionQueue.findFirst({
            where: {
                userId: user.id,
                jobUrl,
                status: { in: ["PENDING", "PROCESSING"] },
            },
        });
        if (existing) {
            return NextResponse.json({ error: "This job is already in your queue.", existing }, { status: 409 });
        }

        const entry = await prisma.extensionQueue.create({
            data: {
                userId: user.id,
                jobId: jobId ?? null,
                jobTitle,
                company: company ?? null,
                jobUrl,
                platform: platform ?? null,
                status: "PENDING",
            },
        });

        return NextResponse.json(entry, { status: 201 });
    } catch (err) {
        console.error("[queue POST]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// ── GET (dashboard) — also supports Clerk session to get all queue items ──────
// (Extension uses token auth above; Dashboard uses Clerk session below via a query param)
// Handled by checking if there's a token header vs Clerk session separately.

export async function OPTIONS() {
    return new NextResponse(null, { headers: CORS });
}
