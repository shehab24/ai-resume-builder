import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { auth } from "@clerk/nextjs/server";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

async function validateToken(req: NextRequest) {
    const header = req.headers.get("authorization");
    if (!header?.startsWith("Bearer ")) return null;
    const hashed = crypto.createHash("sha256").update(header.slice(7).trim()).digest("hex");
    return prisma.user.findFirst({
        where: { extensionToken: hashed, extensionTokenExpiry: { gte: new Date() } },
        select: { id: true },
    });
}

// ── PATCH — Extension updates job status ──────────────────────────────────────
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Try token auth (extension) or Clerk session (dashboard for skipping/cancelling)
        let userId: string | null = null;

        const tokenUser = await validateToken(req);
        if (tokenUser) {
            userId = tokenUser.id;
        } else {
            const { userId: clerkId } = await auth();
            if (clerkId) {
                const u = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
                userId = u?.id ?? null;
            }
        }

        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });

        const body = await req.json();
        const { status, notes } = body;

        const allowed = ["PENDING", "PROCESSING", "DONE", "FAILED", "SKIPPED"];
        if (!allowed.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400, headers: CORS });
        }

        // Verify ownership
        const entry = await prisma.extensionQueue.findFirst({
            where: { id, userId },
        });
        if (!entry) {
            return NextResponse.json({ error: "Not found" }, { status: 404, headers: CORS });
        }

        const updated = await prisma.extensionQueue.update({
            where: { id },
            data: {
                status,
                notes: notes ?? entry.notes,
                processedAt: ["DONE", "FAILED", "SKIPPED"].includes(status) ? new Date() : entry.processedAt,
            },
        });

        // If DONE — also write to ExternalApplication log
        if (status === "DONE") {
            await prisma.externalApplication.create({
                data: {
                    userId,
                    jobTitle: entry.jobTitle,
                    company: entry.company ?? null,
                    jobUrl: entry.jobUrl,
                    platform: entry.platform ?? null,
                    status: "APPLIED",
                    notes: notes ?? null,
                },
            }).catch(() => {}); // Non-critical
        }

        return NextResponse.json(updated, { headers: CORS });
    } catch (err) {
        console.error("[queue/[id] PATCH]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500, headers: CORS });
    }
}

// ── GET — Get a single queue item status (for dashboard polling) ──────────────
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { userId: clerkId } = await auth();
        if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
        if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const entry = await prisma.extensionQueue.findFirst({ where: { id, userId: user.id } });
        if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json(entry);
    } catch (err) {
        console.error("[queue/[id] GET]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, { headers: CORS });
}
