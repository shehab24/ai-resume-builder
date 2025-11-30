"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Mail, Calendar, ExternalLink, Code, Briefcase, GraduationCap, CheckCircle, XCircle, UserCheck, MessageSquare, Sparkles, Video, Crown } from "lucide-react";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { RecruiterSearch } from "@/components/recruiter-search";
import { useSubscription } from "@/hooks/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";

interface ResumeContent {
    summary: string;
    skills: string[];
    experience: Array<{
        position: string;
        company: string;
        startDate: string;
        endDate: string;
        description: string;
    }>;
    education: Array<{
        degree: string;
        school: string;
        year: string;
    }>;
}

interface Application {
    id: string;
    status: string;
    createdAt: string;
    resumeScore: number | null;
    taskScore: number | null;
    compositeScore: number | null;
    aiEvaluation: string | null;
    taskSubmissions: string[];
    user: {
        name: string | null;
        email: string;
        photoUrl: string | null;
    };
    job: {
        title: string;
        tasks: string[];
    };
    resumeContent: ResumeContent | null;
}

export default function ApplicationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const applicationId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [application, setApplication] = useState<Application | null>(null);
    const [generatingQuestions, setGeneratingQuestions] = useState(false);
    const [interviewQuestions, setInterviewQuestions] = useState<any>(null);
    const [isPro, setIsPro] = useState(false);
    const { subscribe, loading: subscribing } = useSubscription();

    // Interview scheduling state
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [schedulingInterview, setSchedulingInterview] = useState(false);
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [duration, setDuration] = useState("60");
    const [panelRecruiters, setPanelRecruiters] = useState<any[]>([]);

    useEffect(() => {
        fetchApplication();
        fetchSubscriptionStatus();
    }, [applicationId]);

    const fetchSubscriptionStatus = async () => {
        try {
            const res = await fetch("/api/user/subscription");
            if (res.ok) {
                const data = await res.json();
                setIsPro(data.subscription?.status === 'ACTIVE' && data.subscription?.plan === 'PRO');
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Auto-open schedule modal if ?schedule=true in URL
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('schedule') === 'true') {
            setShowScheduleModal(true);
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const fetchApplication = async () => {
        try {
            const res = await fetch(`/api/recruiter/applications/${applicationId}`);
            if (!res.ok) throw new Error("Failed to fetch application");
            const data = await res.json();
            setApplication(data.application);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load application details");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (status: string) => {
        setUpdating(true);
        try {
            const res = await fetch(`/api/recruiter/applications/${applicationId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });

            if (!res.ok) throw new Error("Failed to update status");

            toast.success(`Application marked as ${status}`);
            fetchApplication(); // Refresh
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    const generateInterviewQuestions = async () => {
        if (!application) return;

        setGeneratingQuestions(true);
        try {
            const res = await fetch('/api/ai/generate-interview-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateName: application.user.name || 'Candidate',
                    jobTitle: application.job.title,
                    jobRequirements: application.job.tasks,
                    resumeContent: application.resumeContent,
                    taskSubmission: application.taskSubmissions[0] || null,
                    aiEvaluation: application.aiEvaluation
                })
            });

            if (!res.ok) throw new Error('Failed to generate questions');

            const data = await res.json();
            setInterviewQuestions(data.questions);
            toast.success('Interview questions generated!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate interview questions');
        } finally {
            setGeneratingQuestions(false);
        }
    };

    const scheduleInterview = async () => {
        if (!scheduledDate || !scheduledTime) {
            toast.error("Please select date and time");
            return;
        }

        setSchedulingInterview(true);
        try {
            const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);

            const res = await fetch('/api/interviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId,
                    scheduledAt: scheduledAt.toISOString(),
                    duration: parseInt(duration),
                    panelRecruiterIds: panelRecruiters.map(r => r.id)
                })
            });

            if (!res.ok) throw new Error('Failed to schedule interview');

            const interview = await res.json();
            toast.success('Interview scheduled successfully!');
            setShowScheduleModal(false);
            setPanelRecruiters([]); // Reset panel recruiters

            // Show link to join interview (for testing)
            setTimeout(() => {
                toast.success(
                    `Interview created! You can join at: /interview/${interview.id}`,
                    { duration: 10000 }
                );
            }, 500);
        } catch (error) {
            console.error(error);
            toast.error('Failed to schedule interview');
        } finally {
            setSchedulingInterview(false);
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
    if (!application) return <div className="p-10 text-center">Application not found</div>;

    const evaluation = application.aiEvaluation ? JSON.parse(application.aiEvaluation) : null;
    const resume = application.resumeContent;

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
            </Button>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-lg border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                        {application.user.name?.charAt(0) || application.user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{application.user.name || "Anonymous Candidate"}</h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <Mail className="h-4 w-4" /> {application.user.email}
                        </p>
                        <Badge variant="outline" className="mt-2">{application.status}</Badge>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                        onClick={() => updateStatus("SHORTLISTED")}
                        disabled={updating}
                    >
                        <CheckCircle className="mr-2 h-4 w-4" /> Shortlist
                    </Button>
                    <Button
                        variant="default"
                        onClick={() => updateStatus("INTERVIEW")}
                        disabled={updating}
                    >
                        <UserCheck className="mr-2 h-4 w-4" /> Interview
                    </Button>
                    <Button
                        variant="outline"
                        className={`text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 ${!isPro ? 'opacity-70' : ''}`}
                        onClick={() => !isPro ? subscribe('PRO', 999) : setShowScheduleModal(true)}
                        disabled={subscribing}
                    >
                        {!isPro ? <Crown className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}
                        {subscribing ? 'Processing...' : (!isPro ? 'Unlock Video Interview' : 'Schedule Video Interview')}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => updateStatus("REJECTED")}
                        disabled={updating}
                    >
                        <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Resume Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Resume Summary */}
                    {resume && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-primary" />
                                    Resume Highlights
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h3 className="font-semibold mb-2">Summary</h3>
                                    <p className="text-sm text-muted-foreground">{resume.summary}</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {resume.skills?.map((skill, i) => (
                                            <Badge key={i} variant="secondary">{skill}</Badge>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">Experience</h3>
                                    <div className="space-y-4">
                                        {resume.experience?.slice(0, 2).map((exp, i) => (
                                            <div key={i} className="border-l-2 border-primary/20 pl-4">
                                                <h4 className="font-medium">{exp.position}</h4>
                                                <p className="text-sm text-muted-foreground">{exp.company} • {exp.startDate} - {exp.endDate}</p>
                                                <p className="text-sm mt-1 line-clamp-2">{exp.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* AI Evaluation */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Code className="h-5 w-5 text-purple-500" />
                                AI Task Evaluation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!isPro ? (
                                <UpgradePrompt
                                    title="AI Task Evaluation"
                                    message="Get instant AI-powered analysis of candidate task submissions."
                                    feature="Upgrade to Pro to unlock detailed AI insights, strengths, and weaknesses analysis."
                                />
                            ) : (
                                evaluation ? (
                                    <>
                                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
                                            <h3 className="font-semibold mb-2">AI Summary</h3>
                                            <p className="text-sm text-muted-foreground">{evaluation.summary}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                                <h4 className="font-semibold text-green-700 dark:text-green-400 text-sm mb-1">Strengths</h4>
                                                <p className="text-xs">{evaluation.strengths}</p>
                                            </div>
                                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                                <h4 className="font-semibold text-red-700 dark:text-red-400 text-sm mb-1">Weaknesses</h4>
                                                <p className="text-xs">{evaluation.weaknesses}</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground italic">AI evaluation pending or not available.</p>
                                )
                            )}
                        </CardContent>
                    </Card>

                    {/* Task Submission */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Task Submission</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <h4 className="font-semibold text-sm mb-2">Task Requirement:</h4>
                                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                    {application.job.tasks[0] || "No specific task description."}
                                </p>
                            </div>

                            <h4 className="font-semibold text-sm mb-2">Candidate's Solution:</h4>
                            {application.taskSubmissions.length > 0 ? (
                                application.taskSubmissions.map((submission, index) => (
                                    <div key={index} className="mt-2">
                                        {isUrl(submission) ? (
                                            <a
                                                href={submission}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-blue-600 hover:underline bg-blue-50 p-3 rounded-md border border-blue-100"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                {submission}
                                            </a>
                                        ) : (
                                            <div className="rounded-md overflow-hidden border">
                                                <SyntaxHighlighter
                                                    language="javascript"
                                                    style={vscDarkPlus}
                                                    customStyle={{ margin: 0, borderRadius: 0 }}
                                                    showLineNumbers
                                                >
                                                    {submission}
                                                </SyntaxHighlighter>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground italic">No submission yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Scores & Stats */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Match Score</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-center p-6 bg-primary/5 rounded-lg">
                                <div className="text-5xl font-bold text-primary mb-2">{application.compositeScore || "N/A"}</div>
                                <div className="text-sm text-muted-foreground font-medium">Overall Composite Score</div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Resume Match</span>
                                        <span className="font-bold">{application.resumeScore || 0}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500"
                                            style={{ width: `${application.resumeScore || 0}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Task Quality</span>
                                        <span className="font-bold">{application.taskScore || 0}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500"
                                            style={{ width: `${application.taskScore || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Application Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Applied On</span>
                                <span className="font-medium">{new Date(application.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Job Title</span>
                                <span className="font-medium">{application.job.title}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Current Status</span>
                                <Badge variant="outline">{application.status}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Interview Questions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-purple-500" />
                                    Interview Questions
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!isPro ? (
                                <UpgradePrompt
                                    title="AI Interview Questions"
                                    message="Generate tailored interview questions based on the candidate's specific profile and resume."
                                    feature="Upgrade to Pro to automatically generate technical and behavioral questions."
                                />
                            ) : (
                                !interviewQuestions ? (
                                    <div className="text-center py-6">
                                        <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Generate personalized interview questions based on this candidate's profile
                                        </p>
                                        <Button
                                            onClick={generateInterviewQuestions}
                                            disabled={generatingQuestions}
                                            className="w-full"
                                        >
                                            {generatingQuestions && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {generatingQuestions ? 'Generating...' : 'Generate Questions'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <Badge variant="secondary" className="text-xs">
                                                AI Generated
                                            </Badge>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={generateInterviewQuestions}
                                                disabled={generatingQuestions}
                                            >
                                                <Sparkles className="mr-2 h-3 w-3" />
                                                Regenerate
                                            </Button>
                                        </div>

                                        {/* Technical Questions */}
                                        {interviewQuestions.technical && interviewQuestions.technical.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400">
                                                    Technical ({interviewQuestions.technical.length})
                                                </h4>
                                                <div className="space-y-3">
                                                    {interviewQuestions.technical.slice(0, 3).map((q: any, i: number) => (
                                                        <div key={i} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-900">
                                                            <p className="text-sm font-medium mb-1">{q.question}</p>
                                                            <p className="text-xs text-muted-foreground">{q.relevance}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Behavioral Questions */}
                                        {interviewQuestions.behavioral && interviewQuestions.behavioral.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-sm text-green-700 dark:text-green-400">
                                                    Behavioral ({interviewQuestions.behavioral.length})
                                                </h4>
                                                <div className="space-y-3">
                                                    {interviewQuestions.behavioral.slice(0, 2).map((q: any, i: number) => (
                                                        <div key={i} className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-100 dark:border-green-900">
                                                            <p className="text-sm font-medium mb-1">{q.question}</p>
                                                            <p className="text-xs text-muted-foreground">{q.relevance}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Problem Solving */}
                                        {interviewQuestions.problemSolving && interviewQuestions.problemSolving.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-sm text-purple-700 dark:text-purple-400">
                                                    Problem Solving ({interviewQuestions.problemSolving.length})
                                                </h4>
                                                <div className="space-y-3">
                                                    {interviewQuestions.problemSolving.slice(0, 2).map((q: any, i: number) => (
                                                        <div key={i} className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-md border border-purple-100 dark:border-purple-900">
                                                            <p className="text-sm font-medium mb-1">{q.question}</p>
                                                            <p className="text-xs text-muted-foreground">{q.relevance}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            )}
                            {isPro && interviewQuestions && (
                                <Button variant="outline" className="w-full mt-4" size="sm">
                                    View All Questions
                                </Button>
                            )}
                        </CardContent>
                    </Card >
                </div >
            </div >

            {/* Schedule Interview Modal */}
            <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule Video Interview</DialogTitle>
                        <DialogDescription>
                            Schedule a video interview with {application?.user.name || 'the candidate'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div>
                                <Label htmlFor="time">Time</Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input
                                id="duration"
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                min="15"
                                step="15"
                            />
                        </div>

                        {/* Panel Recruiters Section */}
                        <div className="space-y-2">
                            <Label>Interview Panel (Optional)</Label>
                            <p className="text-sm text-muted-foreground">
                                Add other recruiters to join this interview
                            </p>
                            <RecruiterSearch
                                selectedRecruiters={panelRecruiters}
                                onSelect={(recruiter) => setPanelRecruiters([...panelRecruiters, recruiter])}
                                onRemove={(id) => setPanelRecruiters(panelRecruiters.filter(r => r.id !== id))}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={scheduleInterview} disabled={schedulingInterview}>
                            {schedulingInterview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Schedule Interview
                        </Button>
                    </div>
                </DialogContent>
            </Dialog >
        </div >
    );
}
