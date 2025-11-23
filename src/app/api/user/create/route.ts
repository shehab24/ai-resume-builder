import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { clerkId, email, name, role } = body;

        if (!clerkId || !email || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { clerkId },
        });

        if (existingUser) {
            return NextResponse.json(existingUser);
        }

        const user = await prisma.user.create({
            data: {
                clerkId,
                email,
                name,
                role,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
