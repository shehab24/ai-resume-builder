"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, DollarSign, Zap, Briefcase, Calendar, ExternalLink, Clock } from "lucide-react";
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

    const [matchThreshold, setMatchThreshold] = useState(95);

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
                setMatchThreshold(data.matchThreshold || 95);
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Available Jobs
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Browse {jobs.length} jobs that match your profile
                    </p>
                </div>

                {/* Auto-Apply Toggle */}
                <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 shadow-lg">
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
                                className="w-12 h-6 rounded-full appearance-none bg-gray-300 checked:bg-blue-600 relative transition-colors
                                           before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white 
                                           before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6
                                           disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        {autoApply && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                ✓ We'll auto-apply to {matchThreshold}%+ matching jobs
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {jobs.length === 0 ? (
                <div className="text-center py-12">
                    <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Jobs Found</h3>
                    <p className="text-muted-foreground">
                        No jobs found matching your profile. Check back later!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {jobs.map((job) => (
                        <Card key={job.id} className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden flex flex-col">
                            {/* Gradient Header */}
                            <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

                            <CardContent className="p-6 flex-1 flex flex-col">
                                {/* Title */}
                                <div className="space-y-3 flex-1">
                                    <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                                        {job.title}
                                    </h3>

                                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                        {job.description}
                                    </p>

                                    {/* Job Details */}
                                    <div className="flex flex-wrap gap-3 text-sm pt-2">
                                        {job.location && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                                                <MapPin className="h-3.5 w-3.5" />
                                                <span className="font-medium">{job.location}</span>
                                            </div>
                                        )}
                                        {job.salary && (
                                            <div className="flex items-center gap-1.5 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full">
                                                <DollarSign className="h-3.5 w-3.5" />
                                                <span className="font-medium">{job.salary}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Skills */}
                                    <div className="flex flex-wrap gap-2">
                                        {job.requirements.slice(0, 3).map((req, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs font-medium">
                                                {req}
                                            </Badge>
                                        ))}
                                        {job.requirements.length > 3 && (
                                            <Badge variant="secondary" className="text-xs">
                                                +{job.requirements.length - 3}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Date */}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                                        <Clock className="h-3 w-3" />
                                        <span>Posted {new Date(job.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}</span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="pt-4">
                                    <Button
                                        asChild
                                        className="w-full shadow-md hover:shadow-lg transition-shadow"
                                    >
                                        <Link href={`/dashboard/job-seeker/jobs/${job.id}`}>
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View Details
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
