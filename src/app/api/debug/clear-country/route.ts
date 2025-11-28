import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const email = "marcus.hayden4845@gmail.com";

        const user = await prisma.user.update({
            where: { email },
            data: {
                autoApplyCountry: null // Clear country preference
            }
        });

        return NextResponse.json({
            success: true,
            user: user.email,
            autoApplyCountry: user.autoApplyCountry
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
