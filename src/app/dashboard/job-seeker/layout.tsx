"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, Home, User } from "lucide-react";
import { Notifications } from "@/components/Notifications";

export default function JobSeekerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r hidden md:block">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-primary">ResumeAI</h1>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <Link href="/dashboard/job-seeker" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-100 ${pathname === "/dashboard/job-seeker" ? "bg-gray-100" : ""}`}>
                        <Home className="h-4 w-4" />
                        Dashboard
                    </Link>
                    <Link href="/dashboard/job-seeker/resume/create" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-100 ${pathname === "/dashboard/job-seeker/resume/create" ? "bg-gray-100" : ""}`}>
                        <FileText className="h-4 w-4" />
                        Create Resume
                    </Link>
                    <Link href="/dashboard/job-seeker/jobs" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-100 ${pathname === "/dashboard/job-seeker/jobs" ? "bg-gray-100" : ""}`}>
                        <Briefcase className="h-4 w-4" />
                        Available Jobs
                    </Link>
                    <Link href="/dashboard/job-seeker/profile" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-100 ${pathname === "/dashboard/job-seeker/profile" ? "bg-gray-100" : ""}`}>
                        <User className="h-4 w-4" />
                        Profile
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <header className="bg-white border-b h-16 flex items-center justify-between px-6">
                    <div className="md:hidden">Menu</div> {/* Mobile menu trigger placeholder */}
                    <div className="ml-auto flex items-center gap-4">
                        <Notifications />
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </header>
                <main className="p-6 flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
