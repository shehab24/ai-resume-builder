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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const promptText = `
        You are a professional resume writer. Generate a polished, ATS-friendly resume in JSON format based on the following user input:
        "${prompt}"

        IMPORTANT INSTRUCTIONS:
        1. **Professional Summary**: Create a compelling 2-3 sentence professional summary that highlights key strengths, experience, and career goals. DO NOT copy the user's input verbatim - synthesize and professionalize it.
        2. **Experience Descriptions**: Write clear, achievement-focused bullet points using action verbs (e.g., "Developed", "Managed", "Increased").
        3. **Skills**: Extract and categorize relevant technical and soft skills.
        4. **Formatting**: Use proper capitalization, grammar, and professional language throughout.

        The JSON must strictly follow this schema:
        {
          "personalInfo": {
            "fullName": "string (use user's name if provided, otherwise: ${dbUser.name || user.firstName + " " + user.lastName})",
            "email": "string (use user's email if provided, otherwise: ${dbUser.email})",
            "phone": "string (extract from input or leave empty)",
            "linkedin": "string (extract from input or leave empty)",
            "portfolio": "string (extract from input or leave empty)",
            "address": "string (extract from input or leave empty)"
          },
          "summary": "string (2-3 sentences, professionally written, highlighting key strengths and career objectives - DO NOT copy user input directly)",
          "experience": [
            {
              "title": "string (job title)",
              "company": "string (company name)",
              "startDate": "string (YYYY-MM format)",
              "endDate": "string (YYYY-MM or 'Present')",
              "description": "string (3-5 achievement-focused bullet points separated by newlines, starting with action verbs)"
            }
          ],
          "education": [
            {
              "degree": "string (e.g., Bachelor of Science in Computer Science)",
              "school": "string (institution name)",
              "fieldOfStudy": "string (field of study)",
              "startDate": "string (YYYY-MM-DD format)",
              "endDate": "string (YYYY-MM-DD format, or 'present' if currently studying)"
            }
          ],
          "skills": ["string (categorized: technical skills, soft skills, tools, languages)"],
          "projects": [
            {
                "name": "string (project name)",
                "description": "string (brief, professional description of the project and your role)",
                "technologies": ["string (technologies used)"],
                "link": "string (project URL if available)",
                "startDate": "string (YYYY-MM)",
                "endDate": "string (YYYY-MM or 'Present')"
            }
          ],
          "certifications": [
            {
                "name": "string (certification name)",
                "issuer": "string (issuing organization)",
                "date": "string (YYYY-MM)",
                "credentialId": "string (credential ID if available)"
            }
          ],
          "languages": [
            {
                "name": "string (language name)",
                "proficiency": "string (Native, Fluent, Professional, Intermediate, Basic)"
            }
          ],
          "awards": [
            {
                "title": "string (award title)",
                "issuer": "string (issuing organization)",
                "date": "string (YYYY-MM)",
                "description": "string (brief description)"
            }
          ]
        }

        QUALITY GUIDELINES:
        - Use professional, concise language
        - Quantify achievements where possible (e.g., "Increased sales by 30%")
        - Start experience descriptions with strong action verbs
        - Ensure all dates are in proper format (YYYY-MM)
        - If information is missing, use empty strings or empty arrays
        - Make the summary compelling and unique to the candidate
        
        Return ONLY the JSON string, no markdown formatting, no code blocks, no explanations.
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
        layout: templateId,
        themeColor: '#000000'
      };
    }

    // Ensure profile image exists
    if (!resumeData.personalInfo.profileImage) {
      resumeData.personalInfo.profileImage = dbUser.photoUrl || "https://github.com/shadcn.png";
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
  } catch (error: any) {
    console.error("Error generating resume:", error);

    // Handle different types of errors
    if (error.status === 401 || error.message?.includes("API key")) {
      return NextResponse.json({
        error: "Invalid API Key",
        message: "Your Gemini API key is invalid or expired. Please check your API key in the .env file.",
        errorType: "API_KEY_ERROR"
      }, { status: 401 });
    }

    if (error.status === 429 || error.message?.includes("quota") || error.message?.includes("rate limit")) {
      return NextResponse.json({
        error: "Quota Exceeded",
        message: "You've exceeded your Gemini API quota. Please wait or upgrade your plan.",
        errorType: "QUOTA_ERROR",
        retryAfter: error.retryAfter || "Please try again later"
      }, { status: 429 });
    }

    if (error.status === 404 || error.message?.includes("not found")) {
      return NextResponse.json({
        error: "Model Not Found",
        message: "The AI model is not available. Please contact support.",
        errorType: "MODEL_ERROR"
      }, { status: 404 });
    }

    if (error.message?.includes("network") || error.message?.includes("fetch")) {
      return NextResponse.json({
        error: "Network Error",
        message: "Unable to connect to AI service. Please check your internet connection.",
        errorType: "NETWORK_ERROR"
      }, { status: 503 });
    }

    // Generic error
    return NextResponse.json({
      error: "Internal Server Error",
      message: "An unexpected error occurred. Please try again.",
      errorType: "UNKNOWN_ERROR"
    }, { status: 500 });
  }
}
