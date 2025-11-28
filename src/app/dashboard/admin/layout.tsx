"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { LayoutDashboard, Users, Settings, LogOut, Briefcase } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

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

    const navigation = [
        { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
        { name: "User Management", href: "/dashboard/admin/users", icon: Users },
        { name: "Job Management", href: "/dashboard/admin/jobs", icon: Briefcase },
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                        Admin Panel
                    </h1>
                </div>
                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                    ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                                        }`}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-3">
                        <UserButton afterSignOutUrl="/" />
                        <div className="text-sm">
                            <p className="font-medium text-gray-700 dark:text-gray-200">Admin</p>
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
