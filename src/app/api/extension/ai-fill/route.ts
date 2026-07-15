import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// ── Token validation (same as other extension endpoints) ──────────────────────
async function validateExtensionToken(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const rawToken = authHeader.replace("Bearer ", "").trim();
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

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

    return { id: userDoc._id?.$oid || userDoc._id?.toString() || "" };
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SerializedField {
    id?: string;
    name?: string;
    type: string;         // "text"|"email"|"tel"|"select"|"textarea"|"radio"|"checkbox"|"file"
    label?: string;
    placeholder?: string;
    ariaLabel?: string;
    options?: string[];   // for select / radio
    required?: boolean;
    currentValue?: string;
    selector: string;     // unique CSS selector to locate this element
}

interface AiFillRequest {
    fields: SerializedField[];
    profile: {
        name?: string;
        email?: string;
        phone?: string;
        location?: string;
        linkedinUrl?: string;
        portfolioUrl?: string;
        summary?: string;
        skills?: string[];
        yearsOfExperience?: number;
        mostRecentJobTitle?: string;
        mostRecentCompany?: string;
        highestEducation?: string;
        experience?: Array<{
            position?: string;
            company?: string;
            startDate?: string;
            endDate?: string;
            description?: string;
        }>;
        education?: Array<{
            degree?: string;
            school?: string;
        }>;
    };
    jobTitle?: string;
    company?: string;
    pageUrl?: string;
}

interface FieldMapping {
    selector: string;
    value: string;
    action: "type" | "select" | "click" | "check" | "skip";
    confidence: number;   // 0-1
    reason?: string;
}

// ── CORS helpers ──────────────────────────────────────────────────────────────
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders });
}

// ── Main POST ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const user = await validateExtensionToken(req);
        if (!user) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401, headers: corsHeaders });
        }

        const body: AiFillRequest = await req.json();
        const { fields, profile, jobTitle, company, pageUrl } = body;

        if (!fields?.length || !profile) {
            return NextResponse.json({ error: "fields and profile are required" }, { status: 400, headers: corsHeaders });
        }

        // Limit fields to keep prompt size manageable (skip hidden / file inputs)
        const relevantFields = fields
            .filter(f => !["file", "hidden", "password", "submit", "button", "reset", "image"].includes(f.type))
            .slice(0, 60); // Gemini can handle ~60 fields comfortably

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = buildPrompt(relevantFields, profile, jobTitle, company, pageUrl);

        const result = await model.generateContent(prompt);
        const responseText = result.response.text()
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        let mappings: FieldMapping[] = [];
        try {
            const parsed = JSON.parse(responseText);
            mappings = Array.isArray(parsed) ? parsed : (parsed.mappings ?? []);
        } catch {
            console.error("[AI Fill] Failed to parse Gemini response:", responseText.slice(0, 500));
            return NextResponse.json(
                { error: "AI returned an unreadable response. Falling back to rule-based fill." },
                { status: 422, headers: corsHeaders }
            );
        }

        // Filter out low-confidence and skip mappings
        const actionable = mappings.filter(m => m.action !== "skip" && m.confidence >= 0.5);

        return NextResponse.json({ mappings: actionable }, { headers: corsHeaders });

    } catch (error) {
        console.error("[AI Fill] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
    }
}

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildPrompt(
    fields: SerializedField[],
    profile: AiFillRequest["profile"],
    jobTitle?: string,
    company?: string,
    pageUrl?: string
): string {
    const fieldsSummary = fields.map((f, i) => {
        const label = f.label || f.ariaLabel || f.placeholder || f.name || f.id || `field_${i}`;
        const opts = f.options?.length ? ` | options: [${f.options.slice(0, 10).join(", ")}]` : "";
        const req = f.required ? " [REQUIRED]" : "";
        return `${i + 1}. selector="${f.selector}" type=${f.type} label="${label}"${req}${opts}`;
    }).join("\n");

    const profileSummary = JSON.stringify({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        linkedinUrl: profile.linkedinUrl,
        portfolioUrl: profile.portfolioUrl,
        summary: profile.summary?.slice(0, 400),
        skills: profile.skills?.slice(0, 20),
        yearsOfExperience: profile.yearsOfExperience,
        mostRecentJobTitle: profile.mostRecentJobTitle,
        mostRecentCompany: profile.mostRecentCompany,
        highestEducation: profile.highestEducation,
        experience: profile.experience?.slice(0, 3).map(e => ({
            position: e.position,
            company: e.company,
            startDate: e.startDate,
            endDate: e.endDate,
            description: e.description?.slice(0, 200),
        })),
        education: profile.education?.slice(0, 2),
    }, null, 0);

    return `You are an intelligent job application form-filling assistant.

CANDIDATE PROFILE:
${profileSummary}

JOB CONTEXT:
- Applying for: ${jobTitle || "a job"}
- Company: ${company || "unknown"}
- Page: ${pageUrl || "unknown"}

FORM FIELDS TO FILL:
${fieldsSummary}

TASK:
For each form field, determine the best value from the candidate profile.
Return a JSON array of field mappings.

RULES:
- For "text", "email", "tel", "url", "number", "textarea" fields: use action "type" with the value string
- For "select" fields: use action "select" and set value to the exact option text that best matches
- For "radio" fields: use action "click" and set value to the option value/text to select
- For "checkbox" fields: use action "check" if it should be checked (e.g., terms/consent/authorization), else "skip"
- If you cannot determine a reasonable value, use action "skip"
- For name fields: use full name unless the label says "first" or "last"
- For "first name": use only the first word of the full name
- For "last name": use everything after the first word
- For cover letter / motivation / about you: compose a professional 2-3 sentence paragraph using the profile summary and skills
- For desired salary / expected salary: use "Negotiable" unless you can infer better
- For notice period: use "Immediately" or "1 month" as appropriate
- For work authorization / eligible to work: answer "Yes" if radio, check if checkbox
- For years of experience: use the number from profile
- Be smart about education dropdowns — map degree levels (e.g., "Bachelor", "BSc", "B.Sc", "Bachelor's", "Bachelors" all refer to the same level)
- confidence: 0.0 to 1.0 — how confident you are this mapping is correct

OUTPUT FORMAT (return ONLY this JSON, no markdown):
[
  {
    "selector": "CSS selector string",
    "value": "value to fill",
    "action": "type|select|click|check|skip",
    "confidence": 0.95,
    "reason": "optional brief explanation"
  }
]`;
}
