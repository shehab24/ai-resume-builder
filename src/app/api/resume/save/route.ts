import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();

        if (!user) {
            return NextResponse.json(
                { message: "Unauthorized. Please sign in." },
                { status: 401 }
            );
        }

        // Get user from database
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: user.id },
        });

        if (!dbUser) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        const { templateId, personalInfo, summary, skills, experience, education } = await req.json();

        console.log("API /resume/save: Saving resume for user:", dbUser.id);
        console.log("API /resume/save: Template ID:", templateId);
        console.log("API /resume/save: Personal Info:", personalInfo);

        // Create resume title from personal info
        const resumeTitle = personalInfo?.fullName 
            ? `Resume - ${personalInfo.fullName}` 
            : `Resume - ${new Date().toLocaleDateString()}`;

        // Prepare resume content as JSON
        const resumeContent = {
            templateId: templateId || "professional",
            personalInfo: {
                fullName: personalInfo?.fullName || "",
                email: personalInfo?.email || "",
                phone: personalInfo?.phone || "",
                location: personalInfo?.location || "",
                linkedin: personalInfo?.linkedin || "",
                portfolio: personalInfo?.portfolio || "",
            },
            professionalSummary: summary || "",
            skills: skills || [],
            experience: experience || [],
            education: education || [],
        };

        // Create new resume using Prisma
        const newResume = await prisma.resume.create({
            data: {
                userId: dbUser.id,
                title: resumeTitle,
                content: JSON.stringify(resumeContent),
                isDefault: false,
            },
        });

        console.log("API /resume/save: Resume saved successfully with ID:", newResume.id);

        return NextResponse.json({
            success: true,
            message: "Resume saved successfully",
            resumeId: newResume.id,
        });
    } catch (error) {
        console.error("Error saving resume:", error);
        return NextResponse.json(
            { message: "Failed to save resume. Please try again." },
            { status: 500 }
        );
    }
}
