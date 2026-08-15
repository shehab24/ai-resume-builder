import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Validate token from Authorization header and return user
async function validateExtensionToken(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const rawToken = authHeader.replace("Bearer ", "").trim();
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Bypasses Prisma Schema validation using MongoDB native command
    const result = await prisma.$runCommandRaw({
        find: "User",
        filter: {
            extensionToken: hashedToken,
            extensionTokenExpiry: { $gte: { $date: new Date().toISOString() } }
        },
        limit: 1
    }) as any;

    const userDoc = result?.cursor?.firstBatch?.[0];
    if (!userDoc) return null;

    return {
        id: userDoc._id?.$oid || userDoc._id?.toString() || "",
        name: userDoc.name || "",
        email: userDoc.email || "",
        country: userDoc.country || null,
        linkedinProfileUrl: userDoc.linkedinProfileUrl || null,
    };
}

export async function GET(req: NextRequest) {
    try {
        const user = await validateExtensionToken(req);
        if (!user) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
        }

        // Fetch the user's default (or most recent) resume
        const resume = await prisma.resume.findFirst({
            where: { userId: user.id, isDefault: true }
        }) ?? await prisma.resume.findFirst({
            where: { userId: user.id },
            orderBy: { updatedAt: "desc" }
        });

        let resumeData: Record<string, unknown> = {};
        if (resume?.content) {
            try {
                resumeData = JSON.parse(resume.content);
            } catch {
                resumeData = {};
            }
        }

        // Build flat profile object optimized for the extension to fill forms
        const profile = {
            // Identity
            name: user.name ?? "",
            email: user.email ?? "",
            phone: (resumeData.phone as string) ?? "",
            location: (resumeData.location as string) ?? (user.country ?? ""),
            // Prefer the connected LinkedIn profile URL, fall back to resume field
            linkedinUrl: (user as any).linkedinProfileUrl ?? (resumeData.linkedinUrl as string) ?? "",
            linkedinProfileUrl: (user as any).linkedinProfileUrl ?? null,
            portfolioUrl: (resumeData.portfolioUrl as string) ?? "",

            // Resume content for form answers
            summary: (resumeData.summary as string) ?? "",
            skills: (resumeData.skills as string[]) ?? [],
            experience: (resumeData.experience as unknown[]) ?? [],
            education: (resumeData.education as unknown[]) ?? [],
            certifications: (resumeData.certifications as unknown[]) ?? [],

            // Computed fields for common form questions
            yearsOfExperience: computeYearsOfExperience(resumeData.experience as ExperienceEntry[]),
            mostRecentJobTitle: getMostRecentTitle(resumeData.experience as ExperienceEntry[]),
            mostRecentCompany: getMostRecentCompany(resumeData.experience as ExperienceEntry[]),
            highestEducation: getHighestEducation(resumeData.education as EducationEntry[]),

            // Resume PDF URL if available
            resumePdfUrl: resume?.pdfUrl ?? null,
            resumeTitle: resume?.title ?? null,
        };

        return NextResponse.json(profile, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Authorization, Content-Type"
            }
        });

    } catch (error) {
        console.error("Extension profile error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type"
        }
    });
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

interface ExperienceEntry {
    position?: string;
    company?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
}

interface EducationEntry {
    degree?: string;
    school?: string;
    endDate?: string;
}

function computeYearsOfExperience(experience?: ExperienceEntry[]): number {
    if (!experience?.length) return 0;
    let total = 0;
    for (const exp of experience) {
        const start = exp.startDate ? new Date(exp.startDate).getFullYear() : null;
        const end = exp.current || !exp.endDate ? new Date().getFullYear() : new Date(exp.endDate).getFullYear();
        if (start) total += Math.max(0, end - start);
    }
    return Math.round(total);
}

function getMostRecentTitle(experience?: ExperienceEntry[]): string {
    if (!experience?.length) return "";
    return experience[0]?.position ?? "";
}

function getMostRecentCompany(experience?: ExperienceEntry[]): string {
    if (!experience?.length) return "";
    return experience[0]?.company ?? "";
}

function getHighestEducation(education?: EducationEntry[]): string {
    if (!education?.length) return "";
    return `${education[0]?.degree ?? ""} - ${education[0]?.school ?? ""}`.trim().replace(/^-\s*/, "");
}
