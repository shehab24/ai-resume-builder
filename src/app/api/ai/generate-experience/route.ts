import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { position, company, currentDescription } = await req.json();

    if (!position || !company) {
      return NextResponse.json({ error: "Position and company are required" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = currentDescription 
      ? `Improve the following professional experience description for a resume. 
         Position: ${position} at ${company}.
         Current description: ${currentDescription}
         
         Provide 2 distinct, highly professional, achievement-focused versions. 
         Each version should be a string of 3-5 bullet points separated by newlines.
         Use strong action verbs and quantify results where possible.
         Format your response as a JSON object with a "versions" array: {"versions": ["version 1 text", "version 2 text"]}.
         Return ONLY the JSON string. No markdown.`
      : `Generate 2 professional experience description versions for a resume. 
         Position: ${position} at ${company}.
         
         Provide 2 distinct, highly professional, achievement-focused versions. 
         Each version should be a string of 3-5 bullet points separated by newlines.
         Use strong action verbs and quantify results where possible.
         Format your response as a JSON object with a "versions" array: {"versions": ["version 1 text", "version 2 text"]}.
         Return ONLY the JSON string. No markdown.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up markdown code blocks if present
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (e) {
      console.error("Failed to parse AI response:", text);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error generating experience:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
