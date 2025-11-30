"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Briefcase, MapPin, Calendar, CheckCircle, Send, AlertCircle, Link as LinkIcon, FileCode, History, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
    };
}

export default function MyApplicationsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Submission State
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [submissionType, setSubmissionType] = useState<"code" | "link">("code");
    const [codeContent, setCodeContent] = useState("");
    const [linkUrl, setLinkUrl] = useState("");

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

    const handleSubmit = async () => {
        if (!selectedApp) return;

        const content = submissionType === "code" ? codeContent : linkUrl;

        if (!content.trim()) {
            toast.error(`Please enter your ${submissionType}`);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/job-seeker/applications/${selectedApp.id}/submit-task`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submission: content.trim() }),
            });

            if (!res.ok) throw new Error("Failed to submit task");

            toast.success("Task submitted successfully!");
            setCodeContent("");
            setLinkUrl("");
            fetchApplications(); // Refresh list
            setSelectedApp(null); // Close dialog automatically
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit task");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "SHORTLISTED": return "default"; // Black/Dark
            case "INTERVIEW": return "default";
            case "HIRED": return "default"; // Green (custom class needed)
            case "REJECTED": return "destructive";
            default: return "secondary";
        }
    };

    const isUrl = (text: string) => {
        try {
            new URL(text);
            return true;
        } catch {
            return false;
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    const shortlistedApps = applications.filter(app => ["SHORTLISTED", "INTERVIEW", "HIRED"].includes(app.status));
    const regularApps = applications.filter(app => !["SHORTLISTED", "INTERVIEW", "HIRED"].includes(app.status));

    const ApplicationList = ({ apps, showTaskButton }: { apps: Application[], showTaskButton: boolean }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.length === 0 ? (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                    No applications found in this category.
                </div>
            ) : (
                apps.map((app) => (
                    <Card key={app.id} className="hover:shadow-md transition-all flex flex-col">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start gap-2">
                                <div>
                                    <CardTitle className="text-lg line-clamp-1">{app.job.title}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{app.job.company}</p>
                                </div>
                                <Badge variant={getStatusColor(app.status)}>{app.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" /> {app.job.location}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3" /> {new Date(app.createdAt).toLocaleDateString()}
                                </div>
                            </div>

                            {app.job.tasks.length > 0 && showTaskButton && (
                                <div className="bg-muted/50 p-3 rounded-md text-sm">
                                    <div className="font-semibold mb-1 flex items-center gap-2">
                                        <CheckCircle className="h-3 w-3 text-primary" /> Task Required
                                    </div>
                                    <p className="line-clamp-2 text-muted-foreground text-xs">
                                        {app.job.tasks[0]}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="pt-0 flex gap-2">
                            {showTaskButton ? (
                                <Button
                                    variant="default"
                                    className="flex-1"
                                    size="sm"
                                    onClick={() => setSelectedApp(app)}
                                >
                                    {app.taskSubmissions.length > 0 ? "View/Edit Task" : "Submit Task"}
                                </Button>
                            ) : (
                                <Button
                                    variant="secondary"
                                    className="flex-1 cursor-not-allowed opacity-80"
                                    size="sm"
                                    disabled
                                >
                                    Application Pending
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                                onClick={() => router.push(`/dashboard/job-seeker/jobs/${app.job.id}`)}
                                title="View Job Details"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))
            )}
        </div>
    );

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4">
            <div>
                <h1 className="text-3xl font-bold">My Applications</h1>
                <p className="text-muted-foreground mt-2">Track your status and submit tasks.</p>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        All Applications ({regularApps.length})
                    </TabsTrigger>
                    <TabsTrigger value="shortlisted" className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Shortlisted ({shortlistedApps.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                    <ApplicationList apps={regularApps} showTaskButton={false} />
                </TabsContent>

                <TabsContent value="shortlisted">
                    <ApplicationList apps={shortlistedApps} showTaskButton={true} />
                </TabsContent>
            </Tabs>

            {/* Single Dialog for Task Submission */}
            <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Task Submission</DialogTitle>
                        <DialogDescription>
                            Submit your work for <strong>{selectedApp?.job.title}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedApp && (
                        <div className="space-y-6 py-4">
                            {/* Task Description */}
                            <div className="bg-muted p-4 rounded-lg">
                                <h4 className="font-semibold mb-2 text-sm">Task Instructions:</h4>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                    {selectedApp.job.tasks.map((t, i) => <li key={i}>{t}</li>)}
                                </ul>
                            </div>

                            {/* Logic: If submitted, show history & delete option. If not, show form. */}
                            {selectedApp.taskSubmissions.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900">
                                        <h4 className="font-semibold text-green-800 dark:text-green-300 text-sm flex items-center gap-2 mb-2">
                                            <CheckCircle className="h-4 w-4" /> Task Submitted
                                        </h4>
                                        <p className="text-xs text-green-700 dark:text-green-400">
                                            You have already submitted your task. To submit a new version, please delete the existing one first.
                                        </p>
                                    </div>

                                    <div className="border rounded-md">
                                        <div className="bg-muted px-4 py-2 border-b flex justify-between items-center">
                                            <span className="text-sm font-medium">Your Submission</span>
                                        </div>
                                        {selectedApp.taskSubmissions.map((sub, idx) => (
                                            <div key={idx} className="p-4 space-y-3">
                                                {isUrl(sub) ? (
                                                    <a href={sub} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                                                        <ExternalLink className="h-3 w-3" /> {sub}
                                                    </a>
                                                ) : (
                                                    <div className="max-h-40 overflow-y-auto rounded bg-slate-950 p-2">
                                                        <SyntaxHighlighter
                                                            language="javascript"
                                                            style={vscDarkPlus}
                                                            customStyle={{ margin: 0, fontSize: '11px' }}
                                                        >
                                                            {sub}
                                                        </SyntaxHighlighter>
                                                    </div>
                                                )}

                                                <div className="flex justify-end pt-2">
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={async () => {
                                                            if (!confirm("Are you sure you want to delete this submission?")) return;
                                                            try {
                                                                const res = await fetch(`/api/job-seeker/applications/${selectedApp.id}/task`, {
                                                                    method: "DELETE",
                                                                    headers: { "Content-Type": "application/json" },
                                                                    body: JSON.stringify({ index: idx })
                                                                });
                                                                if (!res.ok) throw new Error("Failed");
                                                                toast.success("Submission deleted");

                                                                // Update local state immediately
                                                                const updatedApp = { ...selectedApp };
                                                                updatedApp.taskSubmissions = updatedApp.taskSubmissions.filter((_, i) => i !== idx);
                                                                setSelectedApp(updatedApp);

                                                                fetchApplications();
                                                            } catch (e) {
                                                                toast.error("Failed to delete");
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 w-3 mr-2" /> Delete Submission
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Tabs defaultValue="code" onValueChange={(v) => setSubmissionType(v as any)} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="code" className="flex gap-2"><FileCode className="h-4 w-4" /> Code Snippet</TabsTrigger>
                                            <TabsTrigger value="link" className="flex gap-2"><LinkIcon className="h-4 w-4" /> Link (GitHub/Drive)</TabsTrigger>
                                        </TabsList>

                                        <div className="mt-4 min-h-[200px]">
                                            <TabsContent value="code" className="space-y-3 mt-0">
                                                <Label>Paste your code here</Label>
                                                <Textarea
                                                    placeholder="// Write your solution here..."
                                                    className="font-mono text-xs h-40 resize-none"
                                                    value={codeContent}
                                                    onChange={(e) => setCodeContent(e.target.value)}
                                                />
                                            </TabsContent>

                                            <TabsContent value="link" className="space-y-3 mt-0">
                                                <Label>Project URL</Label>
                                                <Input
                                                    placeholder="https://github.com/username/project"
                                                    value={linkUrl}
                                                    onChange={(e) => setLinkUrl(e.target.value)}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Make sure the link is publicly accessible.
                                                </p>
                                            </TabsContent>
                                        </div>
                                    </Tabs>

                                    <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit Work
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
