"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Briefcase, MapPin, DollarSign, Trash2, Pencil } from "lucide-react";
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
        <div className="max-w-4xl mx-auto space-y-6 p-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Your Posted Jobs</h1>
                <Button onClick={() => router.push("/dashboard/recruiter/jobs/create")}>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Post New Job
                </Button>
            </div>

            {jobs.map((job) => (
                <Card key={job.id}>
                    <CardHeader className="flex flex-col space-y-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl">{job.title}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Posted on {new Date(job.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/recruiter/jobs/${job.id}/edit`)}>
                                    <Pencil className="h-4 w-4 mr-1" /> Edit
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(job.id)}>
                                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex gap-4 text-sm">
                            {job.location && (
                                <span className="flex items-center">
                                    <MapPin className="mr-1 h-4 w-4" /> {job.location}
                                </span>
                            )}
                            {job.salary && (
                                <span className="flex items-center">
                                    <DollarSign className="mr-1 h-4 w-4" /> {job.salary}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {job.requirements.map((req, i) => (
                                <Badge key={i} variant="secondary">{req}</Badge>
                            ))}
                        </div>
                        <div className="pt-2">
                            <Badge variant="outline">
                                {job.applicantCount || 0} Applicants
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            ))}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Job Posting?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the job posting and all associated applications.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
