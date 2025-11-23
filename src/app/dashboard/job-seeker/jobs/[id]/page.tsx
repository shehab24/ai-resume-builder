"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, DollarSign, CheckCircle, Briefcase, Clock, Building, Calendar, Zap } from "lucide-react";
import { toast } from "sonner";

interface Job {
    id: string;
    title: string;
    description: string;
    location: string;
    salary?: string;
    requirements: string[];
    recruiter: { name: string };
    jobType?: string;
    workMode?: string;
    experienceLevel?: string;
    benefits?: string[];
    applicationDeadline?: string;
    tasks?: string[];
    company?: string;
    hasApplied?: boolean;
}

export default function JobDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [hasResume, setHasResume] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await fetch(`/api/jobs/${params.id}`);
                if (!response.ok) throw new Error("Failed to fetch job");
                const data = await response.json();
                setJob(data);
                if (data.hasApplied) {
                    setHasApplied(true);
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load job details");
            } finally {
                setLoading(false);
            }
        };

        const checkResume = async () => {
            try {
                const res = await fetch("/api/resumes");
                if (res.ok) {
                    const data = await res.json();
                    if (data.resumes && data.resumes.length > 0) {
                        setHasResume(true);
                    }
                }
            } catch (error) {
                console.error("Error checking resumes:", error);
            }
        };

        if (params.id) {
            fetchJob();
            checkResume();
        }
    }, [params.id]);

    const handleQuickApply = async () => {
        if (!hasResume) {
            toast.error("Please create a resume first to use Quick Apply");
            router.push("/dashboard/job-seeker/resume/create");
            return;
        }

        setApplying(true);
        try {
            const response = await fetch("/api/applications/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId: params.id }),
            });

            if (!response.ok) throw new Error("Failed to apply");

            const data = await response.json();
            setHasApplied(true);
            toast.success("Application submitted successfully! Recruiter will see your default resume.");

            if (data.tasks && data.tasks.length > 0) {
                toast.info("This job has required tasks. Please check your dashboard.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit application.");
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
                <h3 className="text-lg font-semibold">Job not found</h3>
                <Button variant="link" onClick={() => router.back()}>Go back</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <CardTitle className="text-3xl font-bold">{job.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                                <Building className="h-4 w-4" />
                                <span className="font-medium">{job.company || job.recruiter.name}</span>
                            </div>
                        </div>
                        {hasApplied ? (
                            <Button disabled className="bg-green-600 w-full md:w-auto">
                                <CheckCircle className="mr-2 h-4 w-4" /> Applied
                            </Button>
                        ) : (
                            <Button size="lg" onClick={handleQuickApply} disabled={applying} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                                {applying ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Zap className="mr-2 h-4 w-4 fill-current" />
                                )}
                                Quick Apply
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-4 mt-6 text-sm">
                        <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                            <MapPin className="h-3 w-3" /> {job.location || "Remote"}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                            <Briefcase className="h-3 w-3" /> {job.jobType || "Full-time"}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                            <Clock className="h-3 w-3" /> {job.workMode || "On-site"}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                            <DollarSign className="h-3 w-3" /> {job.salary || "Competitive"}
                        </Badge>
                        {job.applicationDeadline && (
                            <Badge variant="destructive" className="flex items-center gap-1 px-3 py-1">
                                <Calendar className="h-3 w-3" /> Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    <section>
                        <h3 className="text-xl font-semibold mb-3">About the Role</h3>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold mb-3">Requirements</h3>
                        <div className="flex flex-wrap gap-2">
                            {job.requirements.map((req, index) => (
                                <Badge key={index} variant="secondary" className="px-3 py-1">
                                    {req}
                                </Badge>
                            ))}
                        </div>
                    </section>

                    {job.benefits && job.benefits.length > 0 && (
                        <section>
                            <h3 className="text-xl font-semibold mb-3">Benefits</h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {job.benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-center gap-2 text-muted-foreground">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
