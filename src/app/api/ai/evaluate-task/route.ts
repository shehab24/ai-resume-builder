import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const { taskDescription, taskSubmission, jobRequirements, resumeContent } = await req.json();

        if (!taskDescription || !taskSubmission) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let submissionContent = taskSubmission;
        let isUrl = false;

        // Check if submission is a URL
        try {
            const url = new URL(taskSubmission);
            isUrl = true;

            // Try to fetch content if it's a raw file or public page
            try {
                const res = await fetch(taskSubmission);
                if (res.ok) {
                    const contentType = res.headers.get("content-type");
                    if (contentType && (contentType.includes("text") || contentType.includes("json") || contentType.includes("javascript"))) {
                        const text = await res.text();
                        // Limit content size to avoid token limits
                        submissionContent = `[URL Content from ${taskSubmission}]:\n\n${text.substring(0, 20000)}`;
                    } else {
                        submissionContent = `[URL: ${taskSubmission}] - Content could not be fetched automatically (likely binary or protected). Please evaluate based on the URL structure.`;
                    }
                }
            } catch (e) {
                console.log("Failed to fetch URL content:", e);
                submissionContent = `[URL: ${taskSubmission}] - Could not fetch content.`;
            }
        } catch (e) {
            // Not a URL, treat as code/text
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `You are an expert technical recruiter evaluating a candidate's task submission.

**Job Requirements:**
${jobRequirements?.join(", ") || "Not specified"}

**Task Description:**
${taskDescription}

**Candidate's Submission:**
${submissionContent}

**Candidate's Resume Summary:**
${resumeContent ? JSON.stringify(resumeContent).substring(0, 500) : "Not available"}

Please evaluate this submission and provide:
1. **Score (0-100):** Rate the quality, correctness, and completeness. If it's a URL we couldn't fetch, give a provisional score (e.g. 70) and note that manual review is needed.
2. **Strengths:** What did the candidate do well?
3. **Weaknesses:** What could be improved?
4. **Overall Assessment:** Would you recommend this candidate?

Format your response as JSON:
{
  "score": <number>,
  "strengths": "<string>",
  "weaknesses": "<string>",
  "recommendation": "<STRONG_YES | YES | MAYBE | NO>",
  "summary": "<brief assessment>"
}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Try to parse JSON from response
        let evaluation;
        try {
            // Extract JSON from markdown code blocks if present
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
            evaluation = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText);
        } catch (e) {
            // Fallback: return raw text if JSON parsing fails
            evaluation = {
                score: 50,
                strengths: "Unable to parse AI response",
                weaknesses: "Unable to parse AI response",
                recommendation: "MAYBE",
                summary: responseText.substring(0, 500)
            };
        }

        return NextResponse.json({
            success: true,
            evaluation
        });

    } catch (error: any) {
        console.error("AI Evaluation Error:", error);
        return NextResponse.json({
            error: "Failed to evaluate task",
            details: error.message
        }, { status: 500 });
    }
}
