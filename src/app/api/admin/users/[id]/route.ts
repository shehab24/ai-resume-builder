import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify Admin Role
        const currentUser = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!currentUser || currentUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const { id: targetUserId } = await params;

        // Prevent deleting yourself
        if (targetUserId === currentUser.id) {
            return NextResponse.json({ error: "Cannot delete your own admin account" }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id: targetUserId },
        });

        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify Admin Role
        const currentUser = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!currentUser || currentUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { role } = body;

        if (!role || !["JOB_SEEKER", "RECRUITER", "ADMIN"].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        const { id } = await params;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { role },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
