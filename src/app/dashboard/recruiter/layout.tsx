"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, PlusCircle, User, Video, Search } from "lucide-react";
import { useEffect } from "react";
import { Notifications } from "@/components/Notifications";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { useSubscription } from "@/hooks/use-subscription-status";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";

export default function RecruiterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isPro } = useSubscription();
    const pathname = usePathname();

    useEffect(() => {
        const checkProfile = async () => {
            try {
                const res = await fetch("/api/user/profile");
                if (res.ok) {
                    const data = await res.json();

                    // Check if user has correct role
                    if (data.role && data.role !== "RECRUITER") {
                        // Redirect to correct dashboard based on role
                        if (data.role === "JOB_SEEKER") {
                            window.location.href = "/dashboard/job-seeker";
                        } else if (data.role === "ADMIN") {
                            window.location.href = "/dashboard/admin";
                        }
                        return;
                    }

                    // Only check recruiter status if role is RECRUITER
                    if (data.role === "RECRUITER" && data.recruiterStatus !== "APPROVED") {
                        window.location.href = "/recruiter-onboarding";
                        return;
                    }

                    if (data.isBlocked) {
                        if (data.blockedUntil && new Date(data.blockedUntil) < new Date()) {
                            // Expired
                        } else {
                            window.location.href = "/blocked";
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to check profile:", error);
            }
        };
        checkProfile();
    }, [pathname]);

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r hidden md:block">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-primary">ResumeAI <span className="text-xs text-muted-foreground">Recruiter</span></h1>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/dashboard/recruiter">
                            <Briefcase className="mr-2 h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/dashboard/recruiter/jobs">
                            <Briefcase className="mr-2 h-4 w-4" />
                            My Jobs
                        </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/dashboard/recruiter/jobs/create">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Post a Job
                        </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/dashboard/recruiter/candidates">
                            <Users className="mr-2 h-4 w-4" />
                            Candidates
                        </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/dashboard/recruiter/interviews" className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Video className="mr-2 h-4 w-4" />
                                Interviews
                            </div>
                            {!isPro && (
                                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] bg-amber-200 text-amber-900 pointer-events-none">
                                    PRO
                                </Badge>
                            )}
                        </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/dashboard/recruiter/profile">
                            <User className="mr-2 h-4 w-4" />
                            Profile
                        </Link>
                    </Button>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <header className="bg-white border-b h-16 flex items-center justify-between px-6">
                    <div className="md:hidden">Menu</div>
                    <div className="ml-auto flex items-center gap-4">
                        <RoleSwitcher />
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
