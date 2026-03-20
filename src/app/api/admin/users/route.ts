import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!currentUser || currentUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const role     = searchParams.get("role");
        const search   = searchParams.get("search");
        const activity = searchParams.get("activity");
        const page     = parseInt(searchParams.get("page")  || "1");
        const limit    = parseInt(searchParams.get("limit") || "20");
        const skip     = (page - 1) * limit;

        const now           = new Date();
        const oneDayAgo     = new Date(now.getTime() - 1  * 24 * 60 * 60 * 1000);
        const sevenDaysAgo  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Use `any` to bypass stale IDE Prisma type cache — lastSeenAt is in the schema
        // and in the generated .prisma/client types; only @prisma/client wrapper is stale.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        if (role && role !== "ALL") where.role = role;

        if (search) {
            where.OR = [
                { name:  { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        // Activity filter — uses lastSeenAt (updated on every real page visit via /api/user/ping)
        if (activity === "active-today")  where.lastSeenAt = { gte: oneDayAgo };
        if (activity === "active-week")   where.lastSeenAt = { gte: sevenDaysAgo };
        if (activity === "active-month")  where.lastSeenAt = { gte: thirtyDaysAgo };
        // "Never visited" = lastSeenAt field is missing entirely (users before this feature)
        // OR explicitly null. isSet:false is the Prisma MongoDB operator for missing fields.
        if (activity === "never-visited") {
            where.OR = [
                ...(where.OR ?? []),
                { lastSeenAt: { isSet: false } },
                { lastSeenAt: null },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take:      limit,
                orderBy:   { lastSeenAt: "desc" } as any,   // most-recently-seen first
                select: {
                    id:          true,
                    name:        true,
                    email:       true,
                    role:        true,
                    country:     true,
                    createdAt:   true,
                    lastSeenAt:  true,
                    isBlocked:   true,
                    blockedUntil: true,
                    warningCount: true,
                    _count: { select: { postedJobs: true, applications: true } },
                } as any,
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({
            users,
            pagination: { total, pages: Math.ceil(total / limit), page, limit },
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
