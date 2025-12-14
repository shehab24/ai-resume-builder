"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Briefcase, MapPin, DollarSign, Search, Building2, Calendar } from "lucide-react";
import { toast } from "sonner";

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
    createdAt: string;
    recruiterId: string;
}

export default function RecruiterBrowseJobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchCurrentUser();
        fetchJobs();
    }, []);

    useEffect(() => {
        filterJobs();
    }, [searchTerm, jobs]);

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

    const fetchJobs = async () => {
        try {
            const res = await fetch("/api/jobs");
            if (!res.ok) throw new Error("Failed to fetch jobs");
            const data = await res.json();
            setJobs(data);
            setFilteredJobs(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load jobs");
        } finally {
            setLoading(false);
        }
    };

    const filterJobs = () => {
        if (!searchTerm.trim()) {
            setFilteredJobs(jobs);
            return;
        }

        const filtered = jobs.filter(job =>
            job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.location?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredJobs(filtered);
    };

    const isOwnJob = (job: Job) => {
        return job.recruiterId === currentUserId;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div>
                <h1 className="text-3xl font-bold">Browse Jobs</h1>
                <p className="text-muted-foreground mt-2">
                    Explore opportunities from other companies
                </p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by title, company, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Jobs Grid */}
            {filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        {searchTerm ? "No jobs found matching your search" : "No jobs available"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map((job) => {
                        const ownJob = isOwnJob(job);

                        return (
                            <Card key={job.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg line-clamp-2">{job.title}</CardTitle>
                                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                                <Building2 className="h-4 w-4" />
                                                <span>{job.company}</span>
                                            </div>
                                        </div>
                                        {ownJob && (
                                            <Badge variant="secondary" className="shrink-0">
                                                Your Post
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {job.description}
                                    </p>

                                    {/* Details */}
                                    <div className="space-y-2 text-sm">
                                        {job.location && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="h-4 w-4" />
                                                <span>{job.location}</span>
                                            </div>
                                        )}
                                        {job.salary && (
                                            <div className="flex items-center gap-2 text-green-600">
                                                <DollarSign className="h-4 w-4" />
                                                <span className="font-medium">{job.salary}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                            <Calendar className="h-3 w-3" />
                                            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-2">
                                        {job.jobType && (
                                            <Badge variant="outline">{job.jobType}</Badge>
                                        )}
                                        {job.workMode && (
                                            <Badge variant="outline">{job.workMode}</Badge>
                                        )}
                                        {job.experienceLevel && (
                                            <Badge variant="secondary">{job.experienceLevel}</Badge>
                                        )}
                                    </div>

                                    {/* Skills */}
                                    <div className="flex flex-wrap gap-2">
                                        {job.requirements.slice(0, 3).map((req, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                                {req}
                                            </Badge>
                                        ))}
                                        {job.requirements.length > 3 && (
                                            <Badge variant="secondary" className="text-xs">
                                                +{job.requirements.length - 3}
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>

                                <CardFooter className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => router.push(`/dashboard/recruiter/browse-jobs/${job.id}`)}
                                    >
                                        View Details
                                    </Button>
                                    {ownJob ? (
                                        <Button
                                            variant="secondary"
                                            className="flex-1"
                                            disabled
                                        >
                                            Your Job Post
                                        </Button>
                                    ) : (
                                        <Button
                                            className="flex-1"
                                            onClick={() => router.push(`/dashboard/recruiter/browse-jobs/${job.id}`)}
                                        >
                                            Apply Now
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
