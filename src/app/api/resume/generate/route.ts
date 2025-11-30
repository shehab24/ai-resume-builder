import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    console.log("Resume generation - User:", user?.id);

    if (!user) {
      console.log("Resume generation - No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, templateId } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Find the local user ID based on Clerk ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      console.log("Resume generation - User not found in DB:", user.id);
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    console.log("Resume generation - DB User found:", dbUser.id);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const promptText = `
        Generate a professional resume in JSON format based on the following user description:
        "${prompt}"

        The JSON must strictly follow this schema:
        {
          "personalInfo": {
            "fullName": "string (use user's name if not provided: ${dbUser.name || user.firstName + " " + user.lastName})",
            "email": "string (use user's email if not provided: ${dbUser.email})",
            "phone": "string",
            "linkedin": "string",
            "portfolio": "string",
            "address": "string"
          },
          "summary": "string (professional summary inferred from description)",
          "experience": [
            {
              "title": "string",
              "company": "string",
              "startDate": "string (YYYY-MM or Present)",
              "endDate": "string (YYYY-MM or Present)",
              "description": "string (bullet points or paragraph)"
            }
          ],
          "education": [
            {
              "degree": "string",
              "school": "string",
              "graduationDate": "string (YYYY)"
            }
          ],
          "skills": ["string"],
          "projects": [
            {
                "name": "string",
                "description": "string",
                "technologies": ["string"],
                "link": "string",
                "startDate": "string",
                "endDate": "string"
            }
          ],
          "certifications": [
            {
                "name": "string",
                "issuer": "string",
                "date": "string",
                "credentialId": "string"
            }
          ],
          "languages": [
            {
                "name": "string",
                "proficiency": "string"
            }
          ],
          "awards": [
            {
                "title": "string",
                "issuer": "string",
                "date": "string",
                "description": "string"
            }
          ]
        }

        If specific details (like phone, linkedin) are missing in the description, use empty strings.
        Infer skills, experience, and summary intelligently from the provided text.
        Return ONLY the JSON string, no markdown formatting or code blocks.
        `;

    console.log("Generating resume with Gemini...");
    const result = await model.generateContent(promptText);
    const response = await result.response;
    let text = response.text();

    // Clean up markdown code blocks if present
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let resumeData;
    try {
      resumeData = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse AI response:", text);
      // Fallback to mock data if parsing fails
      resumeData = {
        personalInfo: {
          fullName: dbUser.name || user.firstName + " " + user.lastName || "John Doe",
          email: dbUser.email,
          phone: "",
          linkedin: "",
          portfolio: "",
        },
        summary: `Professional based on: ${prompt.substring(0, 50)}...`,
        experience: [],
        education: [],
        skills: ["Communication", "Problem Solving"],
      };
    }

    // Add layout setting from request
    if (templateId) {
      resumeData.settings = {
        ...(resumeData.settings || {}),
        layout: templateId
      };
    }

    // Save to database
    const resume = await prisma.resume.create({
      data: {
        userId: dbUser.id,
        title: `Resume - ${new Date().toLocaleDateString()}`,
        content: JSON.stringify(resumeData),
      },
    });

    console.log("Resume generation - Resume created:", resume.id);

    return NextResponse.json({ resumeId: resume.id, data: resumeData });
  } catch (error) {
    console.error("Error generating resume:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
