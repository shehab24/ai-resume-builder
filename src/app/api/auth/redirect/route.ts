import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Smart sign-in redirect.
 * Called by NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/api/auth/redirect
 * Looks up the user's DB role and immediately redirects:
 *  ADMIN     → /dashboard/admin
 *  RECRUITER → /dashboard/recruiter (layout guard will send non-approved to /recruiter-onboarding)
 *  JOB_SEEKER → /dashboard/job-seeker
 *  New user (no DB record) → /onboarding (to pick role)
 */
export async function GET(req: Request) {
    const base = new URL(req.url).origin;

    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.redirect(`${base}/sign-in`);
        }

        const dbUser = await prisma.user.findUnique({
            where: { clerkId: user.id },
            select: { role: true },
        });

        if (!dbUser) {
            // Brand-new user — go through onboarding to pick role
            return NextResponse.redirect(`${base}/onboarding`);
        }

        if (dbUser.role === "ADMIN")          return NextResponse.redirect(`${base}/dashboard/admin`);
        if (dbUser.role === "RECRUITER")      return NextResponse.redirect(`${base}/dashboard/recruiter`);
        return NextResponse.redirect(`${base}/dashboard/job-seeker`);

    } catch (error) {
        console.error("[auth/redirect] error:", error);
        // Fallback to onboarding on any error
        return NextResponse.redirect(`${base}/onboarding`);
    }
}
