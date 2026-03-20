import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { newRole } = body;

        // Validate role
        if (!newRole || !["JOB_SEEKER", "RECRUITER"].includes(newRole)) {
            return NextResponse.json({ error: "Invalid role. Must be JOB_SEEKER or RECRUITER" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Prevent admins from switching roles
        if (user.role === "ADMIN") {
            return NextResponse.json({ error: "Admins cannot switch roles" }, { status: 403 });
        }

        // Check if already on this role
        if (user.role === newRole) {
            return NextResponse.json({ error: "You are already on this role" }, { status: 400 });
        }

        // If switching to RECRUITER, check status
        if (newRole === "RECRUITER") {
            if ((user.recruiterStatus as string) === "BLOCKED") {
                return NextResponse.json({
                    error: "Your recruiter access has been blocked by an administrator"
                }, { status: 403 });
            }
            if (user.recruiterStatus !== "APPROVED") {
                return NextResponse.json({
                    error: "Your recruiter application must be approved first"
                }, { status: 403 });
            }
        }

        // Update role
        const updatedUser = await prisma.user.update({
            where: { clerkId: userId },
            data: { role: newRole },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            }
        });

        return NextResponse.json({
            message: "Role switched successfully",
            user: updatedUser,
            redirectTo: newRole === "RECRUITER" ? "/dashboard/recruiter" : "/dashboard/job-seeker"
        });
    } catch (error) {
        console.error("Error switching role:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
