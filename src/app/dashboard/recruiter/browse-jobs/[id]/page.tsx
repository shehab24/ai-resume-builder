"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Briefcase, MapPin, DollarSign, Building2, Calendar, Clock, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Job {
    id: string;
    title: string;
    company: string;
    description: string;
    location?: string;
    salary?: string;
    requirements: string[];
    jobType?: string;
    workMode?: string;
    experienceLevel?: string;
    benefits?: string[];
    tasks?: string[];
    applicationDeadline?: string;
    createdAt: string;
    recruiterId: string;
}

export default function RecruiterJobDetailPage() {
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchCurrentUser();
        fetchJob();
        checkApplicationStatus();
    }, [jobId]);

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
                const data = await res.json();
                setCurrentUserId(data.id);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    const fetchJob = async () => {
        try {
            const res = await fetch(`/api/jobs/${jobId}`);
            if (!res.ok) throw new Error("Failed to fetch job");
            const data = await res.json();
            setJob(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load job details");
        } finally {
            setLoading(false);
        }
    };

    const checkApplicationStatus = async () => {
        try {
            const res = await fetch("/api/job-seeker/applications");
            if (res.ok) {
                const applications = await res.json();
                const applied = applications.some((app: any) => app.job.id === jobId);
                setHasApplied(applied);
            }
        } catch (error) {
            console.error("Error checking application status:", error);
        }
    };

    const handleApply = async () => {
        setApplying(true);
        try {
            const res = await fetch("/api/job-seeker/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to apply");
            }

            toast.success("Application submitted successfully!");
            setHasApplied(true);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to apply to job");
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Job not found</p>
                <Button onClick={() => router.back()} className="mt-4">
                    Go Back
                </Button>
            </div>
        );
    }

    const isOwnJob = job.recruiterId === currentUserId;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Back Button */}
            <Link href="/dashboard/recruiter/browse-jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Jobs
            </Link>

            {/* Job Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Building2 className="h-5 w-5" />
                                <span className="text-lg">{job.company}</span>
                            </div>
                        </div>
                        {isOwnJob && (
                            <Badge variant="secondary" className="text-sm">
                                Your Job Post
                            </Badge>
                        )}
                    </div>

                    {/* Quick Info */}
                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                        {job.location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{job.location}</span>
                            </div>
                        )}
                        {job.salary && (
                            <div className="flex items-center gap-2 text-green-600">
                                <DollarSign className="h-4 w-4" />
                                <span className="font-medium">{job.salary}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                        {job.applicationDeadline && (
                            <div className="flex items-center gap-2 text-orange-600">
                                <Clock className="h-4 w-4" />
                                <span>Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {job.jobType && <Badge variant="outline">{job.jobType}</Badge>}
                        {job.workMode && <Badge variant="outline">{job.workMode}</Badge>}
                        {job.experienceLevel && <Badge>{job.experienceLevel}</Badge>}
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Description */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Job Description</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                    </div>

                    {/* Requirements */}
                    {job.requirements.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                {job.requirements.map((req, i) => (
                                    <li key={i}>{req}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Benefits */}
                    {job.benefits && job.benefits.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Benefits</h3>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                {job.benefits.map((benefit, i) => (
                                    <li key={i}>{benefit}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Tasks */}
                    {job.tasks && job.tasks.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Application Tasks</h3>
                            <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-2">
                                    You will be required to complete the following tasks after applying:
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    {job.tasks.map((task, i) => (
                                        <li key={i}>{task}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Apply Button */}
                    <div className="pt-4 border-t">
                        {isOwnJob ? (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <p className="text-sm text-blue-900 dark:text-blue-100">
                                    This is your job posting. You cannot apply to your own jobs.
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-3"
                                    onClick={() => router.push(`/dashboard/recruiter/jobs/${job.id}/applications`)}
                                >
                                    View Applications
                                </Button>
                            </div>
                        ) : hasApplied ? (
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="font-medium text-green-900 dark:text-green-100">Already Applied</p>
                                    <p className="text-sm text-green-700 dark:text-green-200">
                                        You have already submitted an application for this position.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <Button
                                size="lg"
                                className="w-full"
                                onClick={handleApply}
                                disabled={applying}
                            >
                                {applying ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Applying...
                                    </>
                                ) : (
                                    <>
                                        <Briefcase className="mr-2 h-4 w-4" />
                                        Apply for this Position
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
