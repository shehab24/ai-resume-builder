import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { message, context } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `You are an expert interview assistant helping a recruiter during a live interview.

**Context:**
- Candidate: ${context.candidateName || 'Unknown'}
- Position: ${context.jobTitle || 'Unknown'}
- Resume Summary: ${context.resumeContent?.summary?.substring(0, 300) || 'Not available'}
- Skills: ${context.resumeContent?.skills?.join(', ') || 'Not available'}

**Existing Questions:**
${JSON.stringify(context.existingQuestions || {}).substring(0, 500)}

**Recruiter's Question:**
${message}

Provide a helpful, concise response. You can:
- Suggest follow-up questions based on candidate's background
- Provide tips on what to look for in answers
- Help evaluate responses
- Suggest areas to probe deeper

Keep your response under 150 words and be practical.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        return NextResponse.json({ response });
    } catch (error) {
        console.error("Error in interview chat:", error);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}
