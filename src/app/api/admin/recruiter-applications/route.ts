import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: user.id },
        });

        if (!dbUser || dbUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch ALL recruiter-related users:
        // - Users who have role=RECRUITER (active recruiters, including direct assigns)
        // - Users who went through the application flow (recruiterStatus != NONE)
        // We use two separate queries and merge to avoid enum type issues with new BLOCKED value
        const [byRole, byStatus] = await Promise.all([
            // All current/former recruiters by role
            prisma.user.findMany({
                where: { role: "RECRUITER" },
                select: { id: true, name: true, email: true, role: true, recruiterStatus: true, companyInfo: true },
                orderBy: { updatedAt: "desc" },
            }),
            // All users who submitted an application (PENDING, APPROVED, REJECTED, or the new BLOCKED)
            // Use NOT NONE to catch everything without hard-coding enum values
            prisma.user.findMany({
                where: {
                    recruiterStatus: { not: "NONE" },
                },
                select: { id: true, name: true, email: true, role: true, recruiterStatus: true, companyInfo: true },
                orderBy: { updatedAt: "desc" },
            }),
        ]);

        // Merge and deduplicate by id
        const seen = new Set<string>();
        const applications = [...byRole, ...byStatus].filter(u => {
            if (seen.has(u.id)) return false;
            seen.add(u.id);
            return true;
        });

        return NextResponse.json({ applications });

    } catch (error) {
        console.error("Error fetching applications:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
