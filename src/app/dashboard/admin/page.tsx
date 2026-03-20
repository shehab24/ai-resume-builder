"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, FileText, UserCheck, Loader2, Zap, Globe, Plus, Activity, TrendingUp, UserX, ShieldOff, UserPlus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AdminStats {
    totalUsers: number;
    jobSeekers: number;
    recruiters: number;
    totalJobs: number;
    totalApplications: number;
}

interface ActiveUserStats {
    dau: number;
    wau: number;
    mau: number;
    breakdown: {
        daily:   { seekers: number; recruiters: number };
        weekly:  { seekers: number; recruiters: number };
        monthly: { seekers: number; recruiters: number };
    };
    signups: { today: number; thisWeek: number; thisMonth: number };
    suspectedInactive: number;
    blockedCount: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [activeStats, setActiveStats] = useState<ActiveUserStats | null>(null);
    const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");
    const [loading, setLoading] = useState(true);
    const [activeLoading, setActiveLoading] = useState(true);
    const [runningAutoApply, setRunningAutoApply] = useState(false);

    useEffect(() => {
        fetchStats();
        fetchActiveStats();
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
                if (res.status === 403) toast.error("Access Denied: You are not an admin.");
                else throw new Error("Failed to fetch stats");
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

    const fetchActiveStats = async () => {
        try {
            const res = await fetch("/api/admin/active-users");
            if (res.ok) setActiveStats(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setActiveLoading(false);
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

            {/* ── Active Users Analytics ── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-600" />
                            Active Users
                        </h2>
                        <p className="text-sm text-muted-foreground mt-0.5">Track daily, weekly & monthly engagement to identify real vs fake accounts</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setActiveLoading(true); fetchActiveStats(); }} disabled={activeLoading}>
                        {activeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        <span className="ml-1.5">Refresh</span>
                    </Button>
                </div>

                {activeLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                ) : activeStats ? (
                    <>
                        {/* DAU / WAU / MAU summary cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: "Daily Active (24h)",   value: activeStats.dau,  icon: Activity,    color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/20",   sub: `${activeStats.breakdown.daily.seekers} seekers · ${activeStats.breakdown.daily.recruiters} recruiters` },
                                { label: "Weekly Active (7d)",   value: activeStats.wau,  icon: TrendingUp,  color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20", sub: `${activeStats.breakdown.weekly.seekers} seekers · ${activeStats.breakdown.weekly.recruiters} recruiters` },
                                { label: "Monthly Active (30d)", value: activeStats.mau,  icon: Users,       color: "text-emerald-600",bg: "bg-emerald-50 dark:bg-emerald-900/20",sub: `${activeStats.breakdown.monthly.seekers} seekers · ${activeStats.breakdown.monthly.recruiters} recruiters` },
                            ].map(s => (
                                <Card key={s.label} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                                        <div className={`p-2 rounded-full ${s.bg}`}>
                                            <s.icon className={`h-4 w-4 ${s.color}`} />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`text-3xl font-bold ${s.color}`}>{s.value.toLocaleString()}</div>
                                        <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* New Signups + Risk cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">New Signups</CardTitle>
                                    <div className="p-2 rounded-full bg-teal-50 dark:bg-teal-900/20">
                                        <UserPlus className="h-4 w-4 text-teal-600" />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Today</span>
                                        <span className="font-semibold">{activeStats.signups.today}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">This week</span>
                                        <span className="font-semibold">{activeStats.signups.thisWeek}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">This month</span>
                                        <span className="font-semibold">{activeStats.signups.thisMonth}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow border-amber-200 dark:border-amber-800">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Suspected Inactive / Fake</CardTitle>
                                    <div className="p-2 rounded-full bg-amber-50 dark:bg-amber-900/20">
                                        <UserX className="h-4 w-4 text-amber-600" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-amber-600">{activeStats.suspectedInactive.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Accounts 30+ days old, never applied, never updated profile</p>
                                    <Button variant="outline" size="sm" className="mt-3 w-full text-xs" onClick={() => router.push("/dashboard/admin/users")}>
                                        Review Users
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow border-red-200 dark:border-red-800">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Blocked Accounts</CardTitle>
                                    <div className="p-2 rounded-full bg-red-50 dark:bg-red-900/20">
                                        <ShieldOff className="h-4 w-4 text-red-600" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-red-600">{activeStats.blockedCount.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Accounts currently blocked by admin action</p>
                                    <Button variant="outline" size="sm" className="mt-3 w-full text-xs" onClick={() => router.push("/dashboard/admin/users")}>
                                        Manage
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Engagement ratio bar */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Engagement Ratio (Monthly)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {[
                                    { label: "Job Seekers active", value: activeStats.breakdown.monthly.seekers, total: stats?.jobSeekers || 1, color: "bg-blue-500" },
                                    { label: "Recruiters active",  value: activeStats.breakdown.monthly.recruiters, total: stats?.recruiters || 1, color: "bg-violet-500" },
                                ].map(r => {
                                    const pct = Math.min(100, Math.round((r.value / Math.max(r.total, 1)) * 100));
                                    return (
                                        <div key={r.label}>
                                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                <span>{r.label}</span>
                                                <span className="font-semibold">{r.value} / {r.total} &nbsp;({pct}%)</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div className={`h-full ${r.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">Failed to load active user data.</CardContent></Card>
                )}
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
