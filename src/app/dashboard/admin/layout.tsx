"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, Briefcase, ChevronDown, ChevronRight, List, Globe, Plus } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [jobsMenuOpen, setJobsMenuOpen] = useState(true);

    useEffect(() => {
        const checkRole = async () => {
            try {
                const res = await fetch("/api/user/profile");
                if (res.ok) {
                    const data = await res.json();

                    // Check if user has admin role
                    if (data.role && data.role !== "ADMIN") {
                        // Redirect to correct dashboard based on role
                        if (data.role === "JOB_SEEKER") {
                            window.location.href = "/dashboard/job-seeker";
                        } else if (data.role === "RECRUITER") {
                            window.location.href = "/dashboard/recruiter";
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to check role:", error);
            }
        };
        checkRole();
    }, []);

    // Auto-expand jobs menu if on a jobs-related page
    useEffect(() => {
        if (pathname.startsWith('/dashboard/admin/jobs') || pathname.startsWith('/dashboard/admin/job-sources') || pathname.startsWith('/dashboard/admin/import-job')) {
            setJobsMenuOpen(true);
        }
    }, [pathname]);

    const navigation = [
        { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
        { name: "User Management", href: "/dashboard/admin/users", icon: Users },
    ];

    const jobsSubMenu = [
        { name: "All Jobs", href: "/dashboard/admin/jobs", icon: List },
        { name: "Job Sources", href: "/dashboard/admin/job-sources", icon: Globe },
        { name: "Import Job", href: "/dashboard/admin/import-job", icon: Plus },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-xl">
                {/* Header */}
                <div className="flex h-16 items-center justify-center px-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-600 to-orange-600">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                        Admin Panel
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                        ? "bg-gradient-to-r from-red-50 to-orange-50 text-red-600 dark:from-red-900/20 dark:to-orange-900/20 dark:text-red-400 shadow-sm"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm"
                                    }`}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive
                                            ? "text-red-600 dark:text-red-400"
                                            : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                                        }`}
                                />
                                {item.name}
                            </Link>
                        );
                    })}

                    {/* Manage Jobs Section */}
                    <div className="pt-2">
                        <button
                            onClick={() => setJobsMenuOpen(!jobsMenuOpen)}
                            className="w-full group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm"
                        >
                            <div className="flex items-center">
                                <Briefcase className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                <span>Manage Jobs</span>
                            </div>
                            {jobsMenuOpen ? (
                                <ChevronDown className="h-4 w-4 text-gray-400 transition-transform" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400 transition-transform" />
                            )}
                        </button>

                        {/* Sub-menu with smooth animation */}
                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${jobsMenuOpen ? "max-h-48 opacity-100 mt-1" : "max-h-0 opacity-0"
                                }`}
                        >
                            <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-1">
                                {jobsSubMenu.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`group flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${isActive
                                                    ? "bg-gradient-to-r from-red-50 to-orange-50 text-red-600 dark:from-red-900/20 dark:to-orange-900/20 dark:text-red-400 font-medium shadow-sm"
                                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                                                }`}
                                        >
                                            <item.icon
                                                className={`mr-2.5 h-4 w-4 flex-shrink-0 transition-colors ${isActive
                                                        ? "text-red-600 dark:text-red-400"
                                                        : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                                                    }`}
                                            />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* User Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: "w-10 h-10"
                                }
                            }}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">Admin</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Super User</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="pl-64">
                <main className="py-8 px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
