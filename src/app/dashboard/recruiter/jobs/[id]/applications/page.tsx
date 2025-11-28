"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Star, TrendingUp, User, Mail, Award, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Application {
    id: string;
    status: string;
    createdAt: string;
    resumeScore: number | null;
    taskScore: number | null;
    compositeScore: number | null;
    aiEvaluation: string | null;
    isTopCandidate: boolean;
    user: {
        name: string | null;
        email: string;
        photoUrl: string | null;
    };
}

export default function JobApplicationsPage() {
    const params = useParams();
    const jobId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState<Application[]>([]);
    const [topCandidates, setTopCandidates] = useState<Application[]>([]);
    const [otherCandidates, setOtherCandidates] = useState<Application[]>([]);
    const [stats, setStats] = useState({ total: 0, topCandidates: 0, withScores: 0 });

    useEffect(() => {
        fetchApplications();
    }, [jobId]);

    const fetchApplications = async () => {
        try {
            const res = await fetch(`/api/recruiter/jobs/${jobId}/applications`);
            if (!res.ok) throw new Error("Failed to fetch applications");

            const data = await res.json();
            setApplications(data.applications || []);
            setTopCandidates(data.topCandidates || []);
            setOtherCandidates(data.otherCandidates || []);
            setStats(data.stats || { total: 0, topCandidates: 0, withScores: 0 });
        } catch (error) {
            console.error(error);
            toast.error("Failed to load applications");
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number | null) => {
        if (!score) return "text-gray-400";
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    const getScoreBadge = (score: number | null) => {
        if (!score) return <Badge variant="outline">Not Scored</Badge>;
        if (score >= 80) return <Badge className="bg-green-600">Excellent</Badge>;
        if (score >= 60) return <Badge className="bg-yellow-600">Good</Badge>;
        return <Badge variant="destructive">Needs Review</Badge>;
    };

    const ApplicationCard = ({ app }: { app: Application }) => {
        const evaluation = app.aiEvaluation ? JSON.parse(app.aiEvaluation) : null;

        return (
            <Card className={`hover:shadow-lg transition-all ${app.isTopCandidate ? 'border-2 border-primary bg-primary/5' : ''}`}>
                <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                {app.user.name?.charAt(0) || app.user.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    {app.user.name || "Anonymous"}
                                    {app.isTopCandidate && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                                </h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {app.user.email}
                                </p>
                            </div>
                        </div>
                        {app.compositeScore !== null && (
                            <div className="text-right">
                                <div className={`text-3xl font-bold ${getScoreColor(app.compositeScore)}`}>
                                    {app.compositeScore}
                                </div>
                                <div className="text-xs text-muted-foreground">Composite Score</div>
                            </div>
                        )}
                    </div>

                    {app.compositeScore !== null && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <div className="text-xs text-muted-foreground mb-1">Resume Match</div>
                                <div className={`text-2xl font-bold ${getScoreColor(app.resumeScore)}`}>
                                    {app.resumeScore || 0}%
                                </div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                                <div className="text-xs text-muted-foreground mb-1">Task Score</div>
                                <div className={`text-2xl font-bold ${getScoreColor(app.taskScore)}`}>
                                    {app.taskScore || 0}%
                                </div>
                            </div>
                        </div>
                    )}

                    {evaluation && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-sm">AI Evaluation</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{evaluation.summary}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">Recommendation:</span>
                                {getScoreBadge(app.compositeScore)}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button asChild className="flex-1">
                            <Link href={`/dashboard/recruiter/applications/${app.id}`}>
                                View Details
                            </Link>
                        </Button>
                        <Button variant="outline" className="flex-1">
                            Schedule Interview
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Job Applications</h1>
                <p className="text-muted-foreground mt-2">
                    {stats.total} total applications • {stats.topCandidates} top candidates • {stats.withScores} scored
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card className="border-primary">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            Top Candidates
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{stats.topCandidates}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            AI Scored
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.withScores}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Candidates Section */}
            {topCandidates.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <h2 className="text-2xl font-bold">Top Candidates</h2>
                        <Badge className="bg-primary">AI Recommended</Badge>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {topCandidates.map(app => (
                            <ApplicationCard key={app.id} app={app} />
                        ))}
                    </div>
                </div>
            )}

            {/* Other Candidates */}
            {otherCandidates.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Other Candidates</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {otherCandidates.map(app => (
                            <ApplicationCard key={app.id} app={app} />
                        ))}
                    </div>
                </div>
            )}

            {applications.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                        <p className="text-muted-foreground">
                            Applications will appear here once candidates apply to your job.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
