"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock, Mail, Globe, Building, Users } from "lucide-react";
import { toast } from "sonner";

interface RecruiterApplication {
    id: string;
    name: string;
    email: string;
    recruiterStatus: string;
    companyInfo: {
        companyName: string;
        companyEmail: string;
        emailVerified: boolean;
        website: string;
        size?: string;
        description?: string;
        submittedAt: string;
    };
}

export default function AdminRecruiterApplicationsPage() {
    const [applications, setApplications] = useState<RecruiterApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const res = await fetch("/api/admin/recruiter-applications");
            if (res.ok) {
                const data = await res.json();
                setApplications(data.applications);
            }
        } catch (error) {
            console.error("Error fetching applications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: string) => {
        setProcessing(userId);
        try {
            const res = await fetch("/api/admin/recruiter-applications/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId })
            });

            if (res.ok) {
                toast.success("Application approved!");
                fetchApplications();
            } else {
                toast.error("Failed to approve");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (userId: string) => {
        setProcessing(userId);
        try {
            const res = await fetch("/api/admin/recruiter-applications/reject", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId })
            });

            if (res.ok) {
                toast.success("Application rejected");
                fetchApplications();
            } else {
                toast.error("Failed to reject");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    const pendingApplications = applications.filter(app => app.recruiterStatus === "PENDING");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Recruiter Applications</h1>
                <p className="text-muted-foreground">Review and approve recruiter applications</p>
            </div>

            {pendingApplications.length === 0 ? (
                <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        No pending applications
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {pendingApplications.map((app) => (
                        <Card key={app.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-xl">{app.companyInfo.companyName}</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Submitted by: {app.name || app.email}
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="gap-1">
                                        <Clock className="h-3 w-3" />
                                        Pending
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium">Company Email:</span>
                                            <span>{app.companyInfo.companyEmail}</span>
                                            {app.companyInfo.emailVerified ? (
                                                <Badge variant="default" className="bg-green-600 text-xs">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Verified
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">
                                                    Not Verified
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-sm">
                                            <Globe className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium">Website:</span>
                                            <a
                                                href={app.companyInfo.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                {app.companyInfo.website}
                                            </a>
                                        </div>

                                        {app.companyInfo.size && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                <span className="font-medium">Size:</span>
                                                <span>{app.companyInfo.size}</span>
                                            </div>
                                        )}
                                    </div>

                                    {app.companyInfo.description && (
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Description:</p>
                                            <p className="text-sm text-muted-foreground">
                                                {app.companyInfo.description}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleReject(app.id)}
                                        disabled={processing === app.id}
                                        className="gap-2"
                                    >
                                        {processing === app.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <XCircle className="h-4 w-4" />
                                        )}
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => handleApprove(app.id)}
                                        disabled={processing === app.id}
                                        className="gap-2"
                                    >
                                        {processing === app.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4" />
                                        )}
                                        Approve
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
