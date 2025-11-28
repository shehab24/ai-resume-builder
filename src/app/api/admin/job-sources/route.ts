import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// GET - Fetch all job sources
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const sources = await prisma.jobSource.findMany({
            include: {
                _count: {
                    select: { jobs: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(sources);
    } catch (error) {
        console.error("Error fetching job sources:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST - Create new job source
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { name, url, description } = await req.json();

        if (!name || !url) {
            return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
        }

        const source = await prisma.jobSource.create({
            data: {
                name,
                url,
                description: description || null,
            }
        });

        return NextResponse.json(source, { status: 201 });
    } catch (error) {
        console.error("Error creating job source:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
