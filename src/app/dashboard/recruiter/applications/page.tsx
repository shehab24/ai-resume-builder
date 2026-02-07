"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, User, Briefcase, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Application {
    id: string;
    status: string;
    createdAt: string;
    compositeScore: number | null;
    user: {
        name: string | null;
        email: string;
        photoUrl: string | null;
    };
    job: {
        id: string;
        title: string;
    };
}

export default function ApplicationsListPage() {
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState<Application[]>([]);
    const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    useEffect(() => {
        fetchApplications();
    }, []);

    useEffect(() => {
        filterApplications();
    }, [searchQuery, statusFilter, applications]);

    const fetchApplications = async () => {
        try {
            const res = await fetch("/api/recruiter/applications");
            if (!res.ok) throw new Error("Failed to fetch applications");
            const data = await res.json();
            setApplications(data.applications || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load applications");
        } finally {
            setLoading(false);
        }
    };

    const filterApplications = () => {
        let filtered = applications;

        // Filter by status
        if (statusFilter !== "ALL") {
            filtered = filtered.filter(app => app.status === statusFilter);
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(app =>
                app.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.job.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredApplications(filtered);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
            case "REVIEWING": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
            case "SHORTLISTED": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
            case "INTERVIEW": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
            case "REJECTED": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const statuses = ["ALL", "PENDING", "REVIEWING", "SHORTLISTED", "INTERVIEW", "REJECTED"];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">All Applications</h1>
                <p className="text-muted-foreground mt-1">
                    View and manage applications across all your job postings
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by candidate name, email, or job title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {statuses.map((status) => (
                                <Button
                                    key={status}
                                    variant={statusFilter === status ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setStatusFilter(status)}
                                >
                                    {status}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{applications.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {applications.filter(a => a.status === "PENDING").length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Shortlisted</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {applications.filter(a => a.status === "SHORTLISTED").length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Interview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {applications.filter(a => a.status === "INTERVIEW").length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Applications List */}
            {filteredApplications.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">No applications found</h3>
                        <p className="text-muted-foreground max-w-sm mt-2">
                            {searchQuery || statusFilter !== "ALL"
                                ? "Try adjusting your filters"
                                : "Applications will appear here when candidates apply to your jobs"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredApplications.map((application) => (
                        <Card key={application.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                            {application.user.name?.charAt(0) || application.user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-lg">
                                                    {application.user.name || "Anonymous Candidate"}
                                                </h3>
                                                <Badge className={getStatusColor(application.status)}>
                                                    {application.status}
                                                </Badge>
                                                {application.compositeScore && (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        {application.compositeScore}% Match
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {application.user.email}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="h-3 w-3" />
                                                    {application.job.title}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(application.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button asChild>
                                        <Link href={`/dashboard/recruiter/applications/${application.id}`}>
                                            View Details
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
