"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, Trophy, TrendingUp, Users, Award, Download, Mail } from "lucide-react";
import { toast } from "sonner";

interface Candidate {
    id: string;
    rank: number;
    user: {
        name: string | null;
        email: string;
        photoUrl: string | null;
    };
    status: string;
    resumeScore: number | null;
    taskScore: number | null;
    compositeScore: number | null;
    evaluation: any;
    taskSubmissions: string[];
}

interface Stats {
    totalApplicants: number;
    averageScore: number;
    topScore: number;
    shortlisted: number;
    interviewed: number;
}

export default function CandidateRankingPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [job, setJob] = useState<any>(null);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

    useEffect(() => {
        fetchCandidates();
    }, [jobId]);

    const fetchCandidates = async () => {
        try {
            const res = await fetch(`/api/recruiter/jobs/${jobId}/candidates`);
            if (!res.ok) throw new Error("Failed to fetch candidates");
            const data = await res.json();
            setJob(data.job);
            setCandidates(data.candidates);
            setStats(data.stats);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load candidates");
        } finally {
            setLoading(false);
        }
    };

    const toggleCandidateSelection = (candidateId: string) => {
        setSelectedCandidates(prev =>
            prev.includes(candidateId)
                ? prev.filter(id => id !== candidateId)
                : prev.length < 3
                    ? [...prev, candidateId]
                    : prev
        );
    };

    const getScoreColor = (score: number | null) => {
        if (!score) return "text-gray-400";
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-blue-600";
        if (score >= 40) return "text-yellow-600";
        return "text-red-600";
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
        if (rank === 2) return <Award className="h-4 w-4 text-gray-400" />;
        if (rank === 3) return <Award className="h-4 w-4 text-orange-600" />;
        return <span className="text-xs text-muted-foreground">#{rank}</span>;
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    const selectedCandidateData = candidates.filter(c => selectedCandidates.includes(c.id));

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" onClick={() => router.back()} className="mb-2">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <h1 className="text-3xl font-bold">Candidate Rankings</h1>
                    <p className="text-muted-foreground">{job?.title} at {job?.company}</p>
                </div>
                <Button variant="outline" disabled>
                    <Download className="mr-2 h-4 w-4" /> Export Report
                </Button>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Users className="h-8 w-8 text-blue-500" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.totalApplicants}</p>
                                    <p className="text-xs text-muted-foreground">Total Applicants</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="h-8 w-8 text-green-500" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.averageScore.toFixed(0)}</p>
                                    <p className="text-xs text-muted-foreground">Avg Score</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Trophy className="h-8 w-8 text-yellow-500" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.topScore}</p>
                                    <p className="text-xs text-muted-foreground">Top Score</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Award className="h-8 w-8 text-purple-500" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.shortlisted}</p>
                                    <p className="text-xs text-muted-foreground">Shortlisted</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Mail className="h-8 w-8 text-orange-500" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.interviewed}</p>
                                    <p className="text-xs text-muted-foreground">Interviewed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Comparison Section */}
            {selectedCandidates.length > 0 && (
                <Card className="border-2 border-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Compare Selected ({selectedCandidates.length}/3)</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedCandidates([])}
                            >
                                Clear Selection
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`grid grid-cols-${selectedCandidates.length} gap-4`}>
                            {selectedCandidateData.map((candidate) => (
                                <div key={candidate.id} className="space-y-3 border rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold">
                                            {candidate.user.name?.charAt(0) || candidate.user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{candidate.user.name || "Anonymous"}</h4>
                                            <p className="text-xs text-muted-foreground">{candidate.user.email}</p>
                                        </div>
                                        {getRankBadge(candidate.rank)}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Composite</span>
                                            <span className={`font-bold ${getScoreColor(candidate.compositeScore)}`}>
                                                {candidate.compositeScore || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Resume</span>
                                            <span className="font-medium">{candidate.resumeScore || 'N/A'}%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Task</span>
                                            <span className="font-medium">{candidate.taskScore || 'N/A'}%</span>
                                        </div>
                                    </div>

                                    {candidate.evaluation && (
                                        <div className="space-y-2 pt-2 border-t">
                                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-xs">
                                                <p className="font-semibold text-green-700 dark:text-green-400 mb-1">Strengths</p>
                                                <p className="line-clamp-2">{candidate.evaluation.strengths}</p>
                                            </div>
                                            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs">
                                                <p className="font-semibold text-red-700 dark:text-red-400 mb-1">Weaknesses</p>
                                                <p className="line-clamp-2">{candidate.evaluation.weaknesses}</p>
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => router.push(`/dashboard/recruiter/applications/${candidate.id}`)}
                                    >
                                        View Details
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Candidates List */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Candidates</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Select up to 3 candidates to compare side-by-side
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {candidates.map((candidate) => (
                            <div
                                key={candidate.id}
                                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${selectedCandidates.includes(candidate.id)
                                        ? 'border-primary bg-primary/5'
                                        : 'hover:bg-muted/50'
                                    }`}
                            >
                                <Checkbox
                                    checked={selectedCandidates.includes(candidate.id)}
                                    onCheckedChange={() => toggleCandidateSelection(candidate.id)}
                                    disabled={!selectedCandidates.includes(candidate.id) && selectedCandidates.length >= 3}
                                />

                                <div className="flex items-center gap-3 flex-1">
                                    <div className="flex items-center justify-center w-8">
                                        {getRankBadge(candidate.rank)}
                                    </div>

                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                        {candidate.user.name?.charAt(0) || candidate.user.email.charAt(0).toUpperCase()}
                                    </div>

                                    <div className="flex-1">
                                        <h4 className="font-semibold">{candidate.user.name || "Anonymous Candidate"}</h4>
                                        <p className="text-sm text-muted-foreground">{candidate.user.email}</p>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <p className={`text-2xl font-bold ${getScoreColor(candidate.compositeScore)}`}>
                                                {candidate.compositeScore || 'N/A'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Score</p>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-sm font-medium">{candidate.resumeScore || 'N/A'}%</p>
                                            <p className="text-xs text-muted-foreground">Resume</p>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-sm font-medium">{candidate.taskScore || 'N/A'}%</p>
                                            <p className="text-xs text-muted-foreground">Task</p>
                                        </div>

                                        <Badge variant={candidate.status === 'SHORTLISTED' ? 'default' : 'secondary'}>
                                            {candidate.status}
                                        </Badge>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/dashboard/recruiter/applications/${candidate.id}`)}
                                        >
                                            View
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {candidates.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">
                                No scored candidates yet. Candidates will appear here once they submit tasks and get evaluated.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
