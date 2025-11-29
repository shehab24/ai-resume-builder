import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify Admin
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });
        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { content, type } = await req.json(); // type: 'url' or 'text'

        let textToAnalyze = content;

        // If it's a URL, try to fetch the HTML (Basic scraping)
        // Note: This won't work for complex sites like LinkedIn due to auth walls,
        // but works for many company career pages.
        if (type === 'url') {
            try {
                const response = await fetch(content, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; JobBot/1.0;)'
                    }
                });
                const html = await response.text();
                // Strip HTML tags to get raw text (simple version)
                textToAnalyze = html.replace(/<[^>]*>?/gm, ' ').substring(0, 20000); // Limit length
            } catch (error) {
                console.log("Could not fetch URL directly, analyzing URL string itself might not be enough.");
                // Fallback: We proceed with just the URL, maybe AI knows the link? 
                // Unlikely, but if the user pasted text, we use that.
            }
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            You are an expert Job Parser. Extract the following details from the job posting text below.
            Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
            
            Fields to extract:
            - title (string)
            - company (string)
            - location (string)
            - salary (string, e.g. "$100k - $150k" or "Competitive")
            - description (string, summary of the role, max 3 paragraphs)
            - requirements (array of strings, specific skills/qualifications)
            - jobType (string, one of: "Full-time", "Part-time", "Contract", "Internship")
            - workMode (string, one of: "Remote", "Hybrid", "On-site")
            - applicationEmail (string, if found)

            If a field is not found, use null.
            
            Job Posting Text:
            ${textToAnalyze}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean up markdown if present
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const jobData = JSON.parse(cleanJson);

        return NextResponse.json(jobData);

    } catch (error) {
        console.error("AI Parse Error:", error);
        return NextResponse.json({ error: "Failed to parse job details" }, { status: 500 });
    }
}
