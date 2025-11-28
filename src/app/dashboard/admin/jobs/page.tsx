"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Trash2, Eye, Edit, MapPin, Building, Briefcase, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    jobType: string;
    workMode?: string;
    experienceLevel?: string;
    salaryMin?: number;
    salaryMax?: number;
    description?: string;
    requirements?: string[];
    benefits?: string[];
    createdAt: string;
    recruiter: {
        name: string;
        email: string;
    };
    _count: {
        applications: number;
    };
}

export default function JobManagementPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // State for View Job Modal
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchJobs();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search, page]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
            });
            if (search) params.append("search", search);

            const res = await fetch(`/api/admin/jobs?${params}`);
            if (!res.ok) throw new Error("Failed to fetch jobs");

            const data = await res.json();
            setJobs(data.jobs);
            setTotalPages(data.pagination.pages);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load jobs");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteJob = async (jobId: string) => {
        if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/admin/jobs/${jobId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete job");
            }

            toast.success("Job deleted successfully");
            fetchJobs();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to delete job");
        }
    };

    const handleViewJob = (job: Job) => {
        setSelectedJob(job);
        setIsViewOpen(true);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Management</h1>
                <p className="text-gray-500 mt-2">Manage all job postings from recruiters.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by title, company..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Jobs Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Job Title</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Recruiter</TableHead>
                            <TableHead>Applications</TableHead>
                            <TableHead>Posted</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                </TableCell>
                            </TableRow>
                        ) : jobs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                                    No jobs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            jobs.map((job) => (
                                <TableRow key={job.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 dark:text-white">{job.title}</span>
                                            <span className="text-xs text-gray-500">{job.jobType} • {job.location}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{job.company}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{job.recruiter?.name || "Unknown"}</span>
                                            <span className="text-xs text-gray-500">{job.recruiter?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {job._count.applications}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-500">
                                        {format(new Date(job.createdAt), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleViewJob(job)}>
                                                    <Eye className="mr-2 h-4 w-4" /> View Job
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/admin/jobs/${job.id}/edit`}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Job
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleDeleteJob(job.id)} className="text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Job
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Previous
                </Button>
                <span className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                >
                    Next
                </Button>
            </div>

            {/* View Job Modal */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">{selectedJob?.title}</DialogTitle>
                        <DialogDescription>
                            Posted by {selectedJob?.recruiter?.name} ({selectedJob?.recruiter?.email})
                        </DialogDescription>
                    </DialogHeader>

                    {selectedJob && (
                        <div className="space-y-6 mt-4">
                            {/* Key Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="space-y-1">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Building className="w-4 h-4 mr-1" /> Company
                                    </div>
                                    <p className="font-medium">{selectedJob.company}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <MapPin className="w-4 h-4 mr-1" /> Location
                                    </div>
                                    <p className="font-medium">{selectedJob.location}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Briefcase className="w-4 h-4 mr-1" /> Type
                                    </div>
                                    <p className="font-medium">{selectedJob.jobType}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <DollarSign className="w-4 h-4 mr-1" /> Salary
                                    </div>
                                    <p className="font-medium">
                                        {selectedJob.salaryMin && selectedJob.salaryMax
                                            ? `$${selectedJob.salaryMin.toLocaleString()} - $${selectedJob.salaryMax.toLocaleString()}`
                                            : "Not specified"}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Description</h3>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {selectedJob.description}
                                </p>
                            </div>

                            {/* Requirements */}
                            {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {selectedJob.requirements.map((req, i) => (
                                            <li key={i} className="text-gray-700 dark:text-gray-300">{req}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Benefits */}
                            {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Benefits</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {selectedJob.benefits.map((ben, i) => (
                                            <li key={i} className="text-gray-700 dark:text-gray-300">{ben}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="pt-4 border-t flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                                <Link href={`/dashboard/admin/jobs/${selectedJob.id}/edit`}>
                                    <Button>Edit Job</Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
