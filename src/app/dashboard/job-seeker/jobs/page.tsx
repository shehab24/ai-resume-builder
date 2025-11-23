"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, DollarSign } from "lucide-react";

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

    useEffect(() => {
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

        fetchJobs();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Find Jobs</h1>
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
                {jobs.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No jobs found matching your profile.
                    </div>
                )}
            </div>
        </div>
    );
}
