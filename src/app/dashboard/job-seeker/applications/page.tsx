"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Briefcase, MapPin, Building, Calendar, CheckCircle, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Application {
    id: string;
    status: string;
    createdAt: string;
    taskSubmissions: string[];
    job: {
        id: string;
        title: string;
        company: string;
        location: string;
        tasks: string[];
        recruiter: {
            name: string;
        };
    };
}

export default function MyApplicationsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingTask, setSubmittingTask] = useState<string | null>(null);
    const [taskInput, setTaskInput] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const res = await fetch("/api/job-seeker/applications");
            if (!res.ok) throw new Error("Failed to fetch applications");
            const data = await res.json();
            setApplications(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load applications");
        } finally {
            setLoading(false);
        }
    };

    const handleTaskSubmit = async (applicationId: string) => {
        const submission = taskInput[applicationId];
        if (!submission || !submission.trim()) {
            toast.error("Please enter your task submission");
            return;
        }

        setSubmittingTask(applicationId);
        try {
            const res = await fetch(`/api/job-seeker/applications/${applicationId}/submit-task`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submission: submission.trim() }),
            });

            if (!res.ok) throw new Error("Failed to submit task");

            toast.success("Task submitted successfully!");
            setTaskInput({ ...taskInput, [applicationId]: "" });
            fetchApplications(); // Refresh
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit task");
        } finally {
            setSubmittingTask(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING":
                return "secondary";
            case "REVIEWED":
                return "default";
            case "SHORTLISTED":
                return "default";
            case "INTERVIEW":
                return "default";
            case "HIRED":
                return "default";
            case "REJECTED":
                return "destructive";
            default:
                return "secondary";
        }
    };

    const isShortlisted = (status: string) => {
        return status === "SHORTLISTED" || status === "INTERVIEW";
    };

    const shortlistedApps = applications.filter(app => isShortlisted(app.status));
    const regularApps = applications.filter(app => !isShortlisted(app.status));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const ApplicationCard = ({ application, showTasks = false }: { application: Application; showTasks?: boolean }) => (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-1">{application.job.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{application.job.company}</p>
                    </div>
                    <Badge variant={getStatusColor(application.status)} className="shrink-0">
                        {application.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-1 text-sm text-muted-foreground">
                    {application.job.location && (
                        <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-2" />
                            {application.job.location}
                        </div>
                    )}
                    <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-2" />
                        Applied {new Date(application.createdAt).toLocaleDateString()}
                    </div>
                </div>

                {showTasks && application.job.tasks && application.job.tasks.length > 0 && (
                    <div className="space-y-3 pt-3 border-t">
                        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-blue-600" />
                                Required Tasks
                            </h4>
                            <ul className="space-y-1">
                                {application.job.tasks.map((task, idx) => (
                                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                        <span className="text-blue-600 font-bold">{idx + 1}.</span>
                                        <span>{task}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`task-${application.id}`} className="text-sm font-semibold">
                                Submit Your Work
                            </Label>
                            <Textarea
                                id={`task-${application.id}`}
                                placeholder="Paste links to your completed tasks, portfolio, or provide detailed answers..."
                                value={taskInput[application.id] || ""}
                                onChange={(e) => setTaskInput({ ...taskInput, [application.id]: e.target.value })}
                                rows={4}
                                className="text-sm"
                            />
                            <Button
                                onClick={() => handleTaskSubmit(application.id)}
                                disabled={submittingTask === application.id}
                                className="w-full"
                                size="sm"
                            >
                                {submittingTask === application.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                Submit Tasks
                            </Button>
                        </div>

                        {application.taskSubmissions && application.taskSubmissions.length > 0 && (
                            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                                <p className="text-xs font-semibold text-green-800 dark:text-green-200 mb-1 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Submitted
                                </p>
                                <p className="text-xs text-green-700 dark:text-green-300 line-clamp-2">
                                    {application.taskSubmissions[application.taskSubmissions.length - 1]}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/dashboard/job-seeker/jobs/${application.job.id}`)}
                >
                    View Job Details
                </Button>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">My Applications</h1>
                <p className="text-muted-foreground mt-2">Track and manage your job applications</p>
            </div>

            {applications.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                        <p className="text-muted-foreground mb-4">Start applying to jobs to see them here</p>
                        <Button onClick={() => router.push("/dashboard/job-seeker/jobs")}>
                            Browse Jobs
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="shortlisted" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="shortlisted" className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Shortlisted ({shortlistedApps.length})
                        </TabsTrigger>
                        <TabsTrigger value="all" className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            All Applications ({regularApps.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="shortlisted" className="mt-6">
                        {shortlistedApps.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Shortlisted Applications</h3>
                                    <p className="text-muted-foreground">
                                        When recruiters shortlist your application, it will appear here
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {shortlistedApps.map((application) => (
                                    <ApplicationCard key={application.id} application={application} showTasks={true} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="all" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {regularApps.map((application) => (
                                <ApplicationCard key={application.id} application={application} />
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
