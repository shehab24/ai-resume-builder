"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, FileText, UserCheck, Loader2, Zap, Globe, Plus } from "lucide-react";
import { toast } from "sonner";

interface AdminStats {
    totalUsers: number;
    jobSeekers: number;
    recruiters: number;
    totalJobs: number;
    totalApplications: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [runningAutoApply, setRunningAutoApply] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const handleRunAutoApply = async () => {
        setRunningAutoApply(true);
        try {
            const res = await fetch("/api/cron/auto-apply");
            if (!res.ok) throw new Error("Failed to run auto-apply");

            const data = await res.json();
            toast.success(`Auto-Apply Finished! Processed ${data.jobsProcessed} jobs and created ${data.applicationsCreated} applications.`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to run auto-apply system");
        } finally {
            setRunningAutoApply(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/admin/stats");
            if (!res.ok) {
                if (res.status === 403) {
                    toast.error("Access Denied: You are not an admin.");
                } else {
                    throw new Error("Failed to fetch stats");
                }
                return;
            }
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load dashboard stats");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
                <p className="text-gray-500 mt-2">You do not have permission to view this page.</p>
            </div>
        );
    }

    const statCards = [
        {
            title: "Total Users",
            value: stats.totalUsers,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-100 dark:bg-blue-900/20",
        },
        {
            title: "Job Seekers",
            value: stats.jobSeekers,
            icon: UserCheck,
            color: "text-green-600",
            bg: "bg-green-100 dark:bg-green-900/20",
        },
        {
            title: "Recruiters",
            value: stats.recruiters,
            icon: Briefcase,
            color: "text-purple-600",
            bg: "bg-purple-100 dark:bg-purple-900/20",
        },
        {
            title: "Active Jobs",
            value: stats.totalJobs,
            icon: FileText,
            color: "text-orange-600",
            bg: "bg-orange-100 dark:bg-orange-900/20",
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
                <p className="text-gray-500 mt-2">Welcome back, Admin. Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-full ${stat.bg}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* System Actions */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">System Actions</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Auto-Apply */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-medium flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-yellow-500" />
                                        Auto-Apply System
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Manually trigger the background job to match users with recent jobs.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleRunAutoApply}
                                    disabled={runningAutoApply}
                                    className="w-full"
                                >
                                    {runningAutoApply ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Running...
                                        </>
                                    ) : (
                                        "Run Now"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Job Sources */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-medium flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-blue-500" />
                                        Job Sources
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Manage external job boards and sources for aggregation.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => router.push("/dashboard/admin/job-sources")}
                                    variant="secondary"
                                    className="w-full"
                                >
                                    <Globe className="mr-2 h-4 w-4" />
                                    Manage Sources
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Import Job */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-medium flex items-center gap-2">
                                        <Plus className="h-4 w-4 text-green-500" />
                                        Import External Job
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Manually add a job from an external source.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => router.push("/dashboard/admin/import-job")}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Import Job
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
