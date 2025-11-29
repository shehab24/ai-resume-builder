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

        const prompt = `You are an expert technical interviewer. Generate a concise set of interview questions for a candidate.
        
**Job Title:** ${jobTitle}

**Job Requirements:**
${jobRequirements?.slice(0, 5).join("\n") || "Not specified"}

**Candidate's Resume Summary:**
${resumeContent ? JSON.stringify(resumeContent).substring(0, 500) : "Not available"}

**AI Evaluation Results:**
${aiEvaluation ? JSON.stringify(aiEvaluation).substring(0, 500) : "Not available"}

Please generate interview questions in the following JSON format. Do not include any markdown formatting or code blocks, just the raw JSON string.

{
  "technical": [
    { "question": "Question text", "relevance": "Why relevant", "goodAnswer": "What to look for" }
  ],
  "behavioral": [
    { "question": "Question text", "relevance": "Why relevant", "goodAnswer": "What to look for" }
  ],
  "problemSolving": [
    { "question": "Question text", "relevance": "Why relevant", "goodAnswer": "What to look for" }
  ]
}

Generate:
- 5 Technical Questions (covering different aspects of the role)
- 4 Behavioral Questions (leadership, teamwork, problem-solving, adaptability)
- 3 Problem-Solving Questions (practical scenarios)

Keep each question concise and relevant. Ensure the JSON is valid.
`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        let questions;
        try {
            // clean the text to remove markdown code blocks if present
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                questions = JSON.parse(jsonMatch[0]);
            } else {
                questions = JSON.parse(cleanText);
            }
        } catch (e) {
            console.error("Failed to parse AI response:", text);
            // Fallback questions
            questions = {
                technical: [{ question: "Tell me about your technical background.", relevance: "General intro", goodAnswer: "Clear summary of skills" }],
                behavioral: [{ question: "Describe a challenge you faced.", relevance: "Problem solving", goodAnswer: "STAR method" }],
                problemSolving: []
            };
        }

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
