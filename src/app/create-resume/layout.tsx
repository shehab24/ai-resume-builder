"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function CreateResumeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isSignedIn } = useAuth();

    // If user is signed in, redirect to dashboard version
    if (isSignedIn) {
        window.location.href = "/dashboard/job-seeker/resume/create";
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Simple header for public resume builder */}
            <header className="px-6 lg:px-12 h-16 flex items-center justify-between border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                    <FileText className="h-6 w-6" />
                    <span>ResumeAI</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" asChild>
                        <Link href="/sign-in">Log In</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/sign-up">Sign Up</Link>
                    </Button>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
