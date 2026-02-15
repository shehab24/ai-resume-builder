import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { personalInfo, professionalSummary, skills, experience, education } = body;

        // Build the prompt for AI
        const hasPersonalInfo = personalInfo.fullName || personalInfo.email;
        
        const prompt = hasPersonalInfo ? 
        `You are a professional resume writer. Enhance the following resume content to make it more professional and impactful. Return ONLY a JSON object with the enhanced content.

Personal Info:
- Name: ${personalInfo.fullName}
- Email: ${personalInfo.email}
${personalInfo.phone ? `- Phone: ${personalInfo.phone}` : ''}
${personalInfo.location ? `- Location: ${personalInfo.location}` : ''}

Professional Summary:
${professionalSummary || 'Not provided'}

Skills:
${skills.join(', ') || 'Not provided'}

Experience:
${experience.map((exp: any) => `
Position: ${exp.position}
Company: ${exp.company}
Duration: ${exp.startDate} - ${exp.endDate}
Description: ${exp.description}
`).join('\n') || 'Not provided'}

Education:
${education.map((edu: any) => `
Degree: ${edu.degree}
School: ${edu.school}
Year: ${edu.year}
`).join('\n') || 'Not provided'}

Please enhance this resume content and return it in the following JSON format:
{
  "summary": "Enhanced professional summary (2-3 sentences, professional and impactful)",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "position": "Job Title",
      "company": "Company Name",
      "startDate": "Start Date",
      "endDate": "End Date",
      "description": "Enhanced description with achievements and impact"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "school": "School Name",
      "year": "Year"
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no additional text or markdown formatting.`
        :
        `You are a professional resume writer. Based on the following text, extract and enhance resume information. Return ONLY a JSON object.

User's Information:
${professionalSummary}

Please analyze this text and create a professional resume with the following JSON format:
{
  "personalInfo": {
    "fullName": "Extract or infer the person's name (if not found, use 'Professional Candidate')",
    "email": "Extract email if mentioned (if not found, use 'your.email@example.com')",
    "phone": "Extract phone if mentioned (optional)",
    "location": "Extract location if mentioned (optional)"
  },
  "summary": "Create a professional 2-3 sentence summary based on the text",
  "skills": ["Extract and list all technical and soft skills mentioned"],
  "experience": [
    {
      "position": "Extract job title",
      "company": "Extract company name",
      "startDate": "Extract or infer start date",
      "endDate": "Extract or infer end date (use 'Present' if current)",
      "description": "Create professional description of responsibilities and achievements"
    }
  ],
  "education": [
    {
      "degree": "Extract degree/qualification",
      "school": "Extract school/university name",
      "year": "Extract graduation year or period"
    }
  ]
}

IMPORTANT: 
- Extract ALL information mentioned in the text
- If some fields are not mentioned, make reasonable professional inferences
- Return ONLY the JSON object, no additional text or markdown formatting.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Parse the AI response
        let enhancedContent;
        try {
            // Remove markdown code blocks if present
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            enhancedContent = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("Failed to parse AI response:", text);
            // Fallback to original content if AI parsing fails
            enhancedContent = {
                summary: professionalSummary || "Professional with experience in the field",
                skills: skills,
                experience: experience,
                education: education
            };
        }

        return NextResponse.json({ 
            content: {
                personalInfo: enhancedContent.personalInfo || personalInfo,
                summary: enhancedContent.summary,
                skills: enhancedContent.skills,
                experience: enhancedContent.experience,
                education: enhancedContent.education
            }
        });
    } catch (error) {
        console.error("Error generating resume preview:", error);
        return NextResponse.json(
            { error: "Failed to generate preview" },
            { status: 500 }
        );
    }
}
