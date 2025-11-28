import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const {
            candidateName,
            jobTitle,
            jobRequirements,
            resumeContent,
            taskSubmission,
            aiEvaluation
        } = await req.json();

        if (!jobTitle) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `You are an expert technical interviewer. Generate a comprehensive set of interview questions for a candidate.

**Job Title:** ${jobTitle}

**Job Requirements:**
${jobRequirements?.join("\n") || "Not specified"}

**Candidate's Resume Summary:**
${resumeContent ? JSON.stringify(resumeContent).substring(0, 1000) : "Not available"}

**Candidate's Task Submission:**
${taskSubmission || "Not submitted"}

**AI Evaluation Results:**
${aiEvaluation ? JSON.stringify(aiEvaluation) : "Not available"}

Please generate interview questions in the following categories:

1. **Technical Questions (5-7 questions):** Based on required skills and their resume
2. **Behavioral Questions (3-5 questions):** Based on their experience and role requirements
3. **Problem-Solving Questions (2-3 questions):** Related to the task they submitted or job requirements
4. **Follow-up Questions (2-3 questions):** To probe deeper into their weaknesses identified by AI

For each question, provide:
- The question itself
- Why this question is relevant (brief explanation)
- What to look for in a good answer

Format your response as JSON:
{
  "technical": [
    {
      "question": "string",
      "relevance": "string",
      "goodAnswer": "string"
    }
  ],
  "behavioral": [...],
  "problemSolving": [...],
  "followUp": [...]
}`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to parse AI response");
        }

        const questions = JSON.parse(jsonMatch[0]);

        return NextResponse.json({
            questions,
            candidateName,
            jobTitle,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error generating interview questions:", error);
        return NextResponse.json({
            error: "Failed to generate interview questions",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
