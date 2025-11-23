import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

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

        const mockResumeData = {
            personalInfo: {
                fullName: dbUser.name || user.firstName + " " + user.lastName || "John Doe",
                email: dbUser.email,
                phone: "+1 234 567 890",
                linkedin: "linkedin.com/in/johndoe",
                portfolio: "johndoe.com",
            },
            summary: `Experienced professional based on: ${prompt.substring(0, 50)}...`,
            experience: [
                {
                    title: "Software Engineer",
                    company: "Tech Corp",
                    startDate: "2020-01",
                    endDate: "Present",
                    description: "Developed scalable web applications using React and Node.js.",
                },
            ],
            education: [
                {
                    degree: "B.S. Computer Science",
                    school: "University of Tech",
                    graduationDate: "2019",
                },
            ],
            skills: ["JavaScript", "TypeScript", "React", "Next.js", "Node.js"],
        };

        // Save to database
        const resume = await prisma.resume.create({
            data: {
                userId: dbUser.id,
                title: `Resume - ${new Date().toLocaleDateString()}`,
                content: JSON.stringify(mockResumeData),
                // templateId: templateId // If we had a templateId field in schema
            },
        });

        console.log("Resume generation - Resume created:", resume.id);

        return NextResponse.json({ resumeId: resume.id, data: mockResumeData });
    } catch (error) {
        console.error("Error generating resume:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
