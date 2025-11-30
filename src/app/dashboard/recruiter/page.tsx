"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { SubscriptionStatus } from "@/components/dashboard/subscription-status";

export default function RecruiterDashboard() {
    const [stats, setStats] = useState({ activeJobs: 0, totalApplications: 0 });
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, subRes] = await Promise.all([
                    fetch("/api/recruiter/stats"),
                    fetch("/api/user/subscription")
                ]);

                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setStats(data);
                }

                if (subRes.ok) {
                    const data = await subRes.json();
                    setSubscription(data.subscription);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Recruiter Dashboard</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <SubscriptionStatus subscription={subscription} />
                <Card>
                    <CardHeader>
                        <CardTitle>Active Jobs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{stats.activeJobs}</p>
                        <p className="text-sm text-muted-foreground mb-4">Active job postings</p>
                        <Button asChild>
                            <Link href="/dashboard/recruiter/jobs/create">Post New Job</Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Applications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{stats.totalApplications}</p>
                        <p className="text-sm text-muted-foreground mb-4">Across all jobs</p>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/recruiter/candidates">View Candidates</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
