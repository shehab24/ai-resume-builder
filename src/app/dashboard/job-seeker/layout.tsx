"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, Home, User, AlertTriangle, X, Video } from "lucide-react";
import { Notifications } from "@/components/Notifications";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { useEffect, useState } from "react";

export default function JobSeekerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        const checkProfile = async () => {
            try {
                const res = await fetch("/api/user/profile");
                if (res.ok) {
                    const data = await res.json();

                    // Check if user has correct role
                    if (data.role && data.role !== "JOB_SEEKER") {
                        // Redirect to correct dashboard based on role
                        if (data.role === "RECRUITER") {
                            window.location.href = "/dashboard/recruiter";
                        } else if (data.role === "ADMIN") {
                            window.location.href = "/dashboard/admin";
                        }
                        return;
                    }

                    // Check if blocked
                    if (data.isBlocked) {
                        // Check if block is expired
                        if (data.blockedUntil && new Date(data.blockedUntil) < new Date()) {
                            // Block expired, ideally we should call an API to unblock or just let them in
                            // For now, let's assume the backend handles auto-unblock or we just ignore it if expired
                        } else {
                            window.location.href = "/blocked";
                            return;
                        }
                    }

                    // Check if country is null, undefined, or empty string
                    if (data.country === null || data.country === undefined || data.country === "") {
                        setShowWarning(true);
                    } else {
                        setShowWarning(false);
                    }
                } else {
                    console.error("Profile API returned error:", res.status);
                }
            } catch (error) {
                console.error("Failed to check profile:", error);
            }
        };

        checkProfile();
    }, []);

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
                    <Link href="/dashboard/job-seeker/applications" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-100 ${pathname === "/dashboard/job-seeker/applications" ? "bg-gray-100" : ""}`}>
                        <FileText className="h-4 w-4" />
                        My Applications
                    </Link>
                    <Link href="/dashboard/job-seeker/interviews" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-100 ${pathname === "/dashboard/job-seeker/interviews" ? "bg-gray-100" : ""}`}>
                        <Video className="h-4 w-4" />
                        Interviews
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
                        <RoleSwitcher />
                        <Notifications />
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </header>
                <main className="p-6 flex-1 overflow-auto">
                    {showWarning && (
                        <div className="mb-6 bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 shadow-md">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-yellow-900 dark:text-yellow-100 text-lg">
                                        ⚠️ Complete Your Profile Required
                                    </h3>
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                                        Your profile is incomplete. Please add your country information to access all features and apply to jobs.
                                    </p>
                                    <Link href="/dashboard/job-seeker/profile">
                                        <Button size="sm" className="mt-3 bg-yellow-600 hover:bg-yellow-700">
                                            Complete Profile Now
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}
