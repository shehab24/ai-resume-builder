"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, DollarSign, Zap } from "lucide-react";
import { toast } from "sonner";

interface Job {
    id: string;
    title: string;
    description: string;
    location: string;
    salary: string;
    requirements: string[];
    createdAt: string;
}

export default function FindJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoApply, setAutoApply] = useState(false);
    const [updatingAutoApply, setUpdatingAutoApply] = useState(false);

    useEffect(() => {
        fetchJobs();
        fetchAutoApplyStatus();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await fetch("/api/jobs/match");
            if (!response.ok) throw new Error("Failed to fetch jobs");
            const data = await response.json();
            setJobs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAutoApplyStatus = async () => {
        try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
                const data = await res.json();
                setAutoApply(data.autoApply || false);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAutoApplyToggle = async (checked: boolean) => {
        setUpdatingAutoApply(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ autoApply: checked }),
            });

            if (!res.ok) throw new Error("Failed to update auto-apply");

            setAutoApply(checked);
            toast.success(checked ? "Auto-Apply enabled! 🚀" : "Auto-Apply disabled");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update auto-apply setting");
        } finally {
            setUpdatingAutoApply(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Available Jobs</h1>
                    <p className="text-muted-foreground mt-2">
                        Browse jobs that match your profile
                    </p>
                </div>

                {/* Auto-Apply Toggle */}
                <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Zap className="h-5 w-5 text-blue-600" />
                            <div className="flex-1">
                                <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                                    Auto-Apply
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    {autoApply ? "Enabled" : "Disabled"}
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={autoApply}
                                disabled={updatingAutoApply}
                                onChange={(e) => handleAutoApplyToggle(e.target.checked)}
                                className="w-12 h-6 rounded-full appearance-none cursor-pointer bg-gray-300 checked:bg-blue-600 relative transition-colors
                                           before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white 
                                           before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6
                                           disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        {autoApply && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                ✓ We'll auto-apply to 95%+ matching jobs
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {jobs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No jobs found matching your profile.
                </div>
            ) : (
                <div className="grid gap-4">
                    {jobs.map((job) => (
                        <Card key={job.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">{job.title}</CardTitle>
                                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                                            <span className="flex items-center">
                                                <MapPin className="mr-1 h-4 w-4" /> {job.location || "Remote"}
                                            </span>
                                            <span className="flex items-center">
                                                <DollarSign className="mr-1 h-4 w-4" /> {job.salary || "Negotiable"}
                                            </span>
                                        </div>
                                    </div>
                                    <Button asChild>
                                        <Link href={`/dashboard/job-seeker/jobs/${job.id}`}>View Details</Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{job.description}</p>
                                <div className="flex flex-wrap gap-2">
                                    {job.requirements.map((req, index) => (
                                        <Badge key={index} variant="secondary">
                                            {req}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
