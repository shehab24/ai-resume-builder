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

        const { resumeContent, jobTitle, jobRequirements, currentNotes } = await req.json();

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an expert technical recruiter. Based on the candidate's resume, job requirements, and any interview notes provided, generate or update the interview evaluation form.

**Job Title:** ${jobTitle}
**Job Requirements:** ${jobRequirements}

**Candidate Resume Summary:** ${resumeContent?.summary || 'N/A'}
**Candidate Skills:** ${resumeContent?.skills?.join(', ') || 'N/A'}
**Candidate Experience:** ${JSON.stringify(resumeContent?.experience || [])}

**Current Interview Notes/Transcript:**
${currentNotes || 'No notes yet.'}

Generate a JSON object with the following fields (do not include markdown formatting, just the JSON):
{
    "technicalMarks": number (0-10, update based on notes if available, else resume match),
    "behavioralMarks": number (0-10, update based on notes if available, else experience),
    "salaryDiscussed": string (extract from notes if mentioned, e.g. "$100k", else null),
    "benefits": string (extract from notes if mentioned, else null),
    "startDate": string (extract from notes if mentioned, else null),
    "keyTopics": string[] (list of 5-7 key topics, including those mentioned in notes),
    "interviewNotes": string (summarize the candidate's strengths/weaknesses based on resume and notes)
}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean up markdown code blocks if present
        const jsonString = responseText.replace(/```json\n|\n```/g, "").trim();
        const generatedNotes = JSON.parse(jsonString);

        return NextResponse.json(generatedNotes);
    } catch (error) {
        console.error("Error generating notes:", error);
        return NextResponse.json(
            { error: "Failed to generate notes" },
            { status: 500 }
        );
    }
}
