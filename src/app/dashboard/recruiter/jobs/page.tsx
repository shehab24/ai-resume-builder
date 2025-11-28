"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Briefcase, MapPin, DollarSign, Trash2, Pencil, Users, Trophy, Calendar } from "lucide-react";
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
    location?: string;
    salary?: string;
    requirements: string[];
    recruiter: { name: string; email: string };
    jobType?: string;
    workMode?: string;
    experienceLevel?: string;
    benefits?: string[];
    applicationDeadline?: string;
    tasks?: string[];
    applicantCount?: number;
    createdAt: string;
}

export default function RecruiterJobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await fetch("/api/recruiter/jobs");
            if (!res.ok) throw new Error("Failed to fetch jobs");
            const data = await res.json();
            setJobs(data);
        } catch (err) {
            console.error(err);
            toast.error("Could not load your posted jobs.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (jobId: string) => {
        setJobToDelete(jobId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!jobToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/recruiter/jobs/${jobToDelete}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete job");

            toast.success("Job deleted successfully!");
            setJobs(jobs.filter(j => j.id !== jobToDelete));
            setDeleteDialogOpen(false);
            setJobToDelete(null);
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete job");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="p-6 text-center">
                <p className="text-muted-foreground">You have not posted any jobs yet.</p>
                <Button onClick={() => router.push("/dashboard/recruiter/jobs/create")} className="mt-4">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Post a Job
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        My Job Postings
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your job listings and track applications</p>
                </div>
                <Button onClick={() => router.push("/dashboard/recruiter/jobs/create")} size="lg" className="shadow-lg">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Post New Job
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {jobs.map((job) => (
                    <Card key={job.id} className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden">
                        {/* Gradient Header */}
                        <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

                        <CardContent className="p-6 space-y-4">
                            {/* Title & Badge */}
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                                        {job.title}
                                    </h3>
                                    <Badge variant="secondary" className="shrink-0 shadow-sm">
                                        <Users className="h-3 w-3 mr-1" />
                                        {job.applicantCount || 0}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                    {job.description}
                                </p>
                            </div>

                            {/* Job Details */}
                            <div className="flex flex-wrap gap-3 text-sm">
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

                            {/* Type & Mode Badges */}
                            {(job.jobType || job.workMode) && (
                                <div className="flex flex-wrap gap-2">
                                    {job.jobType && (
                                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                            {job.jobType}
                                        </Badge>
                                    )}
                                    {job.workMode && (
                                        <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                                            {job.workMode}
                                        </Badge>
                                    )}
                                </div>
                            )}

                            {/* Skills */}
                            <div className="flex flex-wrap gap-2">
                                {job.requirements.slice(0, 4).map((req, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs font-medium">
                                        {req}
                                    </Badge>
                                ))}
                                {job.requirements.length > 4 && (
                                    <Badge variant="secondary" className="text-xs">
                                        +{job.requirements.length - 4}
                                    </Badge>
                                )}
                            </div>

                            {/* Date */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                                <Calendar className="h-3 w-3" />
                                <span>Posted {new Date(job.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2 pt-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="w-full shadow-md hover:shadow-lg transition-shadow"
                                        onClick={() => router.push(`/dashboard/recruiter/jobs/${job.id}/applications`)}
                                    >
                                        <Users className="h-3.5 w-3.5 mr-1.5" />
                                        Applications
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full shadow-md hover:shadow-lg transition-shadow"
                                        onClick={() => router.push(`/dashboard/recruiter/jobs/${job.id}/candidates`)}
                                    >
                                        <Trophy className="h-3.5 w-3.5 mr-1.5" />
                                        Rankings
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => router.push(`/dashboard/recruiter/jobs/${job.id}/edit`)}
                                    >
                                        <Pencil className="h-3 w-3 mr-1.5" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={() => handleDeleteClick(job.id)}
                                    >
                                        <Trash2 className="h-3 w-3 mr-1.5" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this job posting and all associated applications.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Job"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

