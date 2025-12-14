import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Generate 6-digit OTP
        const token = Math.floor(100000 + Math.random() * 900000).toString();

        // Set expiry to 10 minutes from now
        const expires = new Date(Date.now() + 10 * 60 * 1000);

        // Delete any existing tokens for this email
        await prisma.verificationToken.deleteMany({
            where: { identifier: email }
        });

        // Create new token
        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires
            }
        });

        // TODO: Send email with OTP
        // For now, we'll log it to console
        console.log(`\n==============================================`);
        console.log(`📧 VERIFICATION CODE FOR: ${email}`);
        console.log(`🔑 CODE: ${token}`);
        console.log(`⏰ EXPIRES: ${expires.toLocaleString()}`);
        console.log(`==============================================\n`);

        // In production, use an email service like Resend:
        // await resend.emails.send({
        //     from: 'noreply@yourapp.com',
        //     to: email,
        //     subject: 'Verify Your Company Email',
        //     html: `Your verification code is: <strong>${token}</strong>`
        // });

        return NextResponse.json({
            success: true,
            message: "Verification code sent successfully"
        });

    } catch (error) {
        console.error("Error sending OTP:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
