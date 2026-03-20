import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { jobTitle, experiences = [] } = await req.json();

    if (!jobTitle) {
      return NextResponse.json({ error: "Job title is required" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const promptText = `
        You are a professional resume writer. Given the job title "${jobTitle}" and the following work experiences, provide a JSON array of exactly 15 highly relevant professional skills (both hard and soft skills).
        
        Experiences:
        ${experiences?.map((exp: any) => `- ${exp.position} at ${exp.company}: ${exp.description}`).join('\n') || "No experience provided."}

        Return ONLY a JSON array of strings. No markdown, no explanations.
        Example: ["React", "Project Management", "Node.js", ...]
    `;

    const result = await model.generateContent(promptText);
    const response = await result.response;
    let text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const skills = JSON.parse(text);
      return NextResponse.json({ skills: Array.isArray(skills) ? skills.slice(0, 15) : [] });
    } catch (e) {
      console.error("Failed to parse AI response:", text);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error suggesting skills:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
