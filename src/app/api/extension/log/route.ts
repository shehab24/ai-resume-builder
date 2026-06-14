import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type"
};

// Validate extension token (used by the extension itself)
async function validateExtensionToken(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const rawToken = authHeader.replace("Bearer ", "").trim();
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    return prisma.user.findFirst({
        where: {
            extensionToken: hashedToken,
            extensionTokenExpiry: { gte: new Date() }
        },
        select: { id: true }
    });
}

// POST — Extension logs an external application
export async function POST(req: NextRequest) {
    try {
        const tokenUser = await validateExtensionToken(req);
        if (!tokenUser) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401, headers: CORS_HEADERS });
        }

        const body = await req.json();
        const { jobTitle, company, jobUrl, platform, status, notes } = body;

        if (!jobTitle || !jobUrl) {
            return NextResponse.json({ error: "jobTitle and jobUrl are required" }, { status: 400, headers: CORS_HEADERS });
        }

        const application = await prisma.externalApplication.create({
            data: {
                userId: tokenUser.id,
                jobTitle: jobTitle as string,
                company: (company as string) ?? null,
                jobUrl: jobUrl as string,
                platform: (platform as string) ?? null,
                status: (status as string) ?? "APPLIED",
                notes: (notes as string) ?? null,
            }
        });

        return NextResponse.json({ success: true, id: application.id }, { headers: CORS_HEADERS });

    } catch (error) {
        console.error("Extension log POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: CORS_HEADERS });
    }
}

// GET — Dashboard fetches the user's external application history
export async function GET(req: NextRequest) {
    try {
        // Dashboard uses Clerk session auth
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            // Try extension token fallback
            const tokenUser = await validateExtensionToken(req);
            if (!tokenUser) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
            }

            const applications = await prisma.externalApplication.findMany({
                where: { userId: tokenUser.id },
                orderBy: { appliedAt: "desc" },
                take: 50
            });
            return NextResponse.json(applications, { headers: CORS_HEADERS });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

        const applications = await prisma.externalApplication.findMany({
            where: { userId: user.id },
            orderBy: { appliedAt: "desc" },
            take: limit
        });

        return NextResponse.json(applications);

    } catch (error) {
        console.error("Extension log GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, { headers: CORS_HEADERS });
}
