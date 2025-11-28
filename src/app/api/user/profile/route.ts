import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: {
                name: true,
                email: true,
                country: true,
                photoUrl: true,
                role: true,
                autoApply: true,
                matchThreshold: true,
                autoApplyCountry: true,
                isBlocked: true,
                blockedUntil: true,
                warningCount: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { userId } = await auth();
        console.log("PATCH /api/user/profile - userId:", userId);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        console.log("PATCH /api/user/profile - body:", body);

        const { name, country, photoUrl, autoApply, matchThreshold, autoApplyCountry } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (country !== undefined) updateData.country = country;
        if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
        if (autoApply !== undefined) updateData.autoApply = autoApply;
        if (matchThreshold !== undefined) updateData.matchThreshold = matchThreshold;
        if (autoApplyCountry !== undefined) updateData.autoApplyCountry = autoApplyCountry;

        console.log("PATCH /api/user/profile - updateData:", updateData);

        const user = await prisma.user.update({
            where: { clerkId: userId },
            data: updateData,
        });

        console.log("PATCH /api/user/profile - updated user:", user);
        return NextResponse.json(user);
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
