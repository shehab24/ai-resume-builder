"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, DollarSign, CheckCircle, Briefcase, Clock, Building, Calendar, Zap, ExternalLink, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    isExternal?: boolean;
    externalUrl?: string;
    applicationMethod?: string;
    applicationEmail?: string;
}

export default function JobDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [hasResume, setHasResume] = useState(false);
    const [resumeCount, setResumeCount] = useState(0);
    const [showResumeDialog, setShowResumeDialog] = useState(false);

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
                    setResumeCount(data.resumes?.length || 0);
                    if (data.resumes && data.resumes.length > 0) {
                        // Check if there's a default resume
                        const hasDefault = data.resumes.some((resume: any) => resume.isDefault);
                        setHasResume(hasDefault);
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

    const handleApply = async () => {
        if (!job) return;

        // Check if user has a resume first (required for all applications)
        if (!hasResume) {
            setShowResumeDialog(true);
            return;
        }

        // Handle External Application
        if (job.isExternal) {
            if (job.applicationMethod === "EMAIL" && job.applicationEmail) {
                window.location.href = `mailto:${job.applicationEmail}?subject=Application for ${job.title}`;
                toast.info("Opening email client...");
                return;
            }
            if (job.applicationMethod === "EXTERNAL_LINK" && job.externalUrl) {
                window.open(job.externalUrl, "_blank");
                toast.success("Redirecting to application page...");
                return;
            }
        }

        // Handle Internal Quick Apply
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
            <Card className="overflow-hidden border-t-4 border-t-primary">
                <CardHeader className="bg-muted/10 pb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="space-y-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
                                <div className="flex items-center gap-2 mt-2 text-lg text-muted-foreground font-medium">
                                    <Building className="h-5 w-5" />
                                    <span>{job.company || job.recruiter.name}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {job.location && (
                                    <Badge variant="secondary" className="px-3 py-1.5 text-sm font-normal">
                                        <MapPin className="mr-1.5 h-3.5 w-3.5" /> {job.location}
                                    </Badge>
                                )}
                                {job.jobType && (
                                    <Badge variant="secondary" className="px-3 py-1.5 text-sm font-normal">
                                        <Briefcase className="mr-1.5 h-3.5 w-3.5" /> {job.jobType}
                                    </Badge>
                                )}
                                {job.workMode && (
                                    <Badge variant="secondary" className="px-3 py-1.5 text-sm font-normal">
                                        <Clock className="mr-1.5 h-3.5 w-3.5" /> {job.workMode}
                                    </Badge>
                                )}
                                {job.salary && (
                                    <Badge variant="secondary" className="px-3 py-1.5 text-sm font-normal bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                        <DollarSign className="mr-1.5 h-3.5 w-3.5" /> {job.salary}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="w-full md:w-auto shrink-0">
                            {hasApplied ? (
                                <Button disabled className="bg-green-600 w-full md:w-auto h-12 text-base px-8">
                                    <CheckCircle className="mr-2 h-5 w-5" /> Applied
                                </Button>
                            ) : (
                                <Button
                                    size="lg"
                                    onClick={handleApply}
                                    disabled={applying}
                                    className="w-full md:w-auto h-12 text-base px-8 shadow-lg hover:shadow-xl transition-all"
                                >
                                    {applying ? (
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    ) : job.isExternal ? (
                                        <ExternalLink className="mr-2 h-5 w-5" />
                                    ) : (
                                        <Zap className="mr-2 h-5 w-5 fill-current" />
                                    )}
                                    {job.isExternal ? "Apply on Company Site" : "Quick Apply"}
                                </Button>
                            )}
                            {job.applicationDeadline && (
                                <p className="text-xs text-center mt-2 text-muted-foreground">
                                    Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                    <section>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            About the Role
                        </h3>
                        <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {job.description}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            Requirements
                        </h3>
                        <ul className="space-y-3">
                            {job.requirements.map((req, index) => (
                                <li key={index} className="flex items-start gap-3 text-muted-foreground">
                                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                    <span className="leading-relaxed">{req}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {job.benefits && job.benefits.length > 0 && (
                        <section>
                            <h3 className="text-xl font-bold mb-4">Benefits</h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {job.benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-center gap-2 text-muted-foreground p-3 rounded-lg bg-muted/50">
                                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </CardContent>
            </Card>

            {/* Resume Required Dialog */}
            <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                            {resumeCount === 0 ? "No Resume Found" : "No Default Resume Selected"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2">
                            {resumeCount === 0 ? (
                                <>
                                    <p className="text-base">
                                        You don't have any resume to apply for this job.
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Please create a resume first, then set it as default to apply for jobs.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-base">
                                        You have {resumeCount} resume{resumeCount > 1 ? 's' : ''}, but none is selected as default.
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Please select one resume as your default to apply for jobs. Your default resume will be sent to recruiters.
                                    </p>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (resumeCount === 0) {
                                    router.push("/dashboard/job-seeker/resume/create");
                                } else {
                                    router.push("/dashboard/job-seeker/resumes");
                                }
                            }}
                            className="gap-2"
                        >
                            <FileText className="h-4 w-4" />
                            {resumeCount === 0 ? "Create Resume" : "Select Default Resume"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
