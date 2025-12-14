import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, token } = body;

        if (!email || !token) {
            return NextResponse.json({ error: "Email and token are required" }, { status: 400 });
        }

        // Find the verification token
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                identifier: email,
                token: token
            }
        });

        if (!verificationToken) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
        }

        // Check if token has expired
        if (new Date() > verificationToken.expires) {
            // Delete expired token
            await prisma.verificationToken.delete({
                where: { id: verificationToken.id }
            });
            return NextResponse.json({ error: "Verification code has expired" }, { status: 400 });
        }

        // Token is valid, delete it (one-time use)
        await prisma.verificationToken.delete({
            where: { id: verificationToken.id }
        });

        return NextResponse.json({
            success: true,
            message: "Email verified successfully"
        });

    } catch (error) {
        console.error("Error verifying OTP:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
