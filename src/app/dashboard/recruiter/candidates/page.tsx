"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
                // API returns an array of jobs directly
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
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Jobs List */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-xl font-semibold">Your Job Postings</h2>
                        {jobs.map((job) => (
                            <Card
                                key={job.id}
                                className={`cursor-pointer transition-all hover:shadow-md ${selectedJob === job.id ? "border-primary border-2" : ""
                                    }`}
                                onClick={() => fetchApplications(job.id)}
                            >
                                <CardContent className="p-4">
                                    <h3 className="font-semibold truncate">{job.title}</h3>
                                    <p className="text-sm text-muted-foreground truncate">{job.company}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{job.location}</p>
                                    <div className="flex items-center justify-between mt-3">
                                        <Badge variant="secondary" className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {job.applicantCount} applicants
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "N/A"}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Applications List */}
                    <div className="lg:col-span-2">
                        {!selectedJob ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Select a Job</h3>
                                    <p className="text-muted-foreground">Click on a job posting to view its applications</p>
                                </CardContent>
                            </Card>
                        ) : loadingApplications ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : applications.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                                    <p className="text-muted-foreground">This job hasn't received any applications</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold">Applications ({applications.length})</h2>
                                {applications.map((application) => (
                                    <Card key={application.id}>
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-lg">{application.user.name || "Anonymous"}</CardTitle>
                                                    <CardDescription className="flex items-center gap-2 mt-1">
                                                        <Mail className="h-3 w-3" />
                                                        {application.user.email}
                                                    </CardDescription>
                                                </div>
                                                <Badge
                                                    variant={
                                                        application.status === "PENDING"
                                                            ? "secondary"
                                                            : application.status === "REVIEWED"
                                                                ? "default"
                                                                : application.status === "INTERVIEW"
                                                                    ? "default"
                                                                    : application.status === "HIRED"
                                                                        ? "default"
                                                                        : "destructive"
                                                    }
                                                >
                                                    {application.status}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="h-4 w-4" />
                                                    Applied on {new Date(application.createdAt).toLocaleDateString()}
                                                </div>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/dashboard/recruiter/applications/${application.id}`}>
                                                        View Details
                                                        <ExternalLink className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
