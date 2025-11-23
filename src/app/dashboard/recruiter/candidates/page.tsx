"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Briefcase, Mail, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    createdAt: string;
    applicantCount: number;
}

interface Application {
    id: string;
    status: string;
    createdAt: string;
    user: {
        name: string;
        email: string;
    };
}

export default function CandidatesPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJob, setSelectedJob] = useState<string | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingApplications, setLoadingApplications] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await fetch("/api/recruiter/jobs");
            if (response.ok) {
                const data = await response.json();
                setJobs(data);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchApplications = async (jobId: string) => {
        setLoadingApplications(true);
        setSelectedJob(jobId);
        try {
            const response = await fetch(`/api/recruiter/jobs/${jobId}/applications`);
            if (response.ok) {
                const data = await response.json();
                setApplications(data.applications);
            }
        } catch (error) {
            console.error("Error fetching applications:", error);
        } finally {
            setLoadingApplications(false);
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
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Users className="h-8 w-8" />
                    Candidates
                </h1>
                <p className="text-muted-foreground mt-2">View and manage applications for your job postings</p>
            </div>

            {jobs.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Jobs Posted Yet</h3>
                        <p className="text-muted-foreground mb-4">Post your first job to start receiving applications</p>
                        <Button asChild>
                            <Link href="/dashboard/recruiter/jobs/create">Post a Job</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Job List - Left Side */}
                    <div className="lg:col-span-1 space-y-3">
                        <h2 className="text-lg font-semibold">Your Jobs</h2>
                        <div className="space-y-2">
                            {jobs.map((job) => (
                                <Card
                                    key={job.id}
                                    className={`cursor-pointer transition-all hover:shadow-md ${selectedJob === job.id ? "border-primary bg-primary/5" : ""
                                        }`}
                                    onClick={() => fetchApplications(job.id)}
                                >
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-base line-clamp-1">{job.title}</CardTitle>
                                        <div className="flex items-center justify-between mt-2">
                                            <Badge variant="outline" className="text-xs">
                                                <Users className="h-3 w-3 mr-1" />
                                                {job.applicantCount} applicants
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(job.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Applications - Right Side */}
                    <div className="lg:col-span-2">
                        {!selectedJob ? (
                            <Card className="h-full">
                                <CardContent className="flex items-center justify-center h-64">
                                    <div className="text-center text-muted-foreground">
                                        <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Select a job to view applications</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : loadingApplications ? (
                            <Card className="h-full">
                                <CardContent className="flex items-center justify-center h-64">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </CardContent>
                            </Card>
                        ) : applications.length === 0 ? (
                            <Card className="h-full">
                                <CardContent className="flex items-center justify-center h-64">
                                    <div className="text-center text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No applications yet for this job</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                <h2 className="text-lg font-semibold">Applications ({applications.length})</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {applications.map((application) => (
                                        <Card key={application.id} className="hover:shadow-md transition-shadow">
                                            <CardHeader className="p-4">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <CardTitle className="text-base truncate">
                                                            {application.user.name || "Anonymous"}
                                                        </CardTitle>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                            <Mail className="h-3 w-3" />
                                                            <span className="truncate">{application.user.email}</span>
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant={
                                                            application.status === "PENDING"
                                                                ? "secondary"
                                                                : application.status === "HIRED"
                                                                    ? "default"
                                                                    : "outline"
                                                        }
                                                        className="shrink-0"
                                                    >
                                                        {application.status}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(application.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <Button size="sm" variant="ghost" asChild>
                                                        <Link href={`/dashboard/recruiter/applications/${application.id}`}>
                                                            <ExternalLink className="h-3 w-3 mr-1" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
