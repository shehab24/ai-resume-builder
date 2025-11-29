"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Video, Briefcase, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Interview {
    id: string;
    scheduledAt: string;
    duration: number;
    status: string;
    application: {
        job: {
            title: string;
            recruiter: {
                name: string;
                email: string;
            };
        };
    };
}

export default function JobSeekerInterviewsPage() {
    const [loading, setLoading] = useState(true);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchInterviews();
    }, []);

    const fetchInterviews = async () => {
        try {
            const res = await fetch("/api/interviews");
            if (!res.ok) throw new Error("Failed to fetch interviews");
            const data = await res.json();
            setInterviews(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load interviews");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'ACCEPTED' | 'DECLINED') => {
        setProcessing(id);
        try {
            const res = await fetch(`/api/interviews/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (!res.ok) throw new Error("Failed to update status");

            toast.success(`Interview ${status.toLowerCase()} successfully`);
            fetchInterviews();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update interview status");
        } finally {
            setProcessing(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "SCHEDULED": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
            case "ACCEPTED": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
            case "COMPLETED": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
            case "CANCELLED": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">My Interviews</h1>
                <p className="text-muted-foreground mt-1">Manage your upcoming job interviews</p>
            </div>

            {interviews.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                            <Video className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold">No interviews yet</h3>
                        <p className="text-muted-foreground max-w-sm mt-2">
                            When recruiters schedule an interview, it will appear here.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {interviews.map((interview) => (
                        <Card key={interview.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row">
                                    {/* Date Column */}
                                    <div className="bg-purple-50 dark:bg-purple-900/10 p-6 flex flex-col items-center justify-center min-w-[150px] border-b md:border-b-0 md:border-r border-purple-100 dark:border-purple-900/20">
                                        <span className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                                            {new Date(interview.scheduledAt).getDate()}
                                        </span>
                                        <span className="text-sm font-medium text-purple-600 dark:text-purple-300 uppercase">
                                            {new Date(interview.scheduledAt).toLocaleString('default', { month: 'short' })}
                                        </span>
                                        <div className="mt-2 flex items-center text-xs text-muted-foreground bg-white dark:bg-gray-800 px-2 py-1 rounded-full shadow-sm">
                                            <Clock className="mr-1 h-3 w-3" />
                                            {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>

                                    {/* Info Column */}
                                    <div className="flex-1 p-6 flex flex-col justify-center">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                            <div>
                                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                                    {interview.application.job.title}
                                                    <Badge variant="secondary" className={getStatusColor(interview.status)}>
                                                        {interview.status}
                                                    </Badge>
                                                </h3>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Briefcase className="h-3 w-3" /> {interview.application.job.recruiter.name}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> {interview.duration} mins
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 items-center">
                                                {interview.status === "SCHEDULED" && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-green-600 border-green-200 hover:bg-green-50"
                                                            onClick={() => handleStatusUpdate(interview.id, 'ACCEPTED')}
                                                            disabled={!!processing}
                                                        >
                                                            {processing === interview.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                                            Accept
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                                            onClick={() => handleStatusUpdate(interview.id, 'DECLINED')}
                                                            disabled={!!processing}
                                                        >
                                                            {processing === interview.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                                            Decline
                                                        </Button>
                                                    </>
                                                )}

                                                {interview.status === "ACCEPTED" && (
                                                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700" asChild>
                                                        <Link href={`/interview/${interview.id}`} target="_blank">
                                                            <Video className="mr-2 h-4 w-4" /> Join Interview
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
