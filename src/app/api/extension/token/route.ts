import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
    try {
        const { userId: clerkId } = await auth();
        console.log("[extension/token] clerkId:", clerkId);
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, name: true, email: true, photoUrl: true }
        });

        console.log("[extension/token] user:", user?.id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Generate a random token and hash it for storage
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Store hashed token in DB
        await prisma.user.update({
            where: { id: user.id },
            data: {
                extensionToken: hashedToken,
                extensionTokenExpiry: expiresAt,
                extensionConnectedAt: new Date()
            }
        });

        console.log("[extension/token] token generated OK");
        // Return the raw token (user never sees the hashed version)
        return NextResponse.json({
            token: rawToken,
            userId: user.id,
            name: user.name,
            email: user.email,
            photoUrl: user.photoUrl,
            expiresAt: expiresAt.toISOString()
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("[extension/token] ERROR:", msg, error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// Disconnect the extension by clearing the token
export async function DELETE() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.user.update({
            where: { clerkId },
            data: {
                extensionToken: null,
                extensionTokenExpiry: null,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Extension disconnect error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
