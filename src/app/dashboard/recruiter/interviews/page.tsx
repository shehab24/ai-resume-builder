"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Calendar, Clock, Video, User, Briefcase, ExternalLink, Users, UserPlus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { RecruiterSearch } from "@/components/recruiter-search";

interface Interview {
    id: string;
    applicationId: string;
    scheduledAt: string;
    duration: number;
    status: string;
    application: {
        id: string;
        user: {
            name: string;
            email: string;
            photoUrl: string;
        };
        job: {
            title: string;
        };
    };
    participants?: Array<{
        id: string;
        role: string;
        user: {
            id: string;
            name: string;
            email: string;
            photoUrl: string;
        };
    }>;
}

export default function RecruiterInterviewsPage() {
    const [loading, setLoading] = useState(true);
    const [interviews, setInterviews] = useState<Interview[]>([]);

    // Invite modal state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
    const [panelRecruiters, setPanelRecruiters] = useState<any[]>([]);
    const [inviting, setInviting] = useState(false);

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

    const openInviteModal = (interview: Interview) => {
        setSelectedInterview(interview);
        setPanelRecruiters([]);
        setShowInviteModal(true);
    };

    const inviteRecruiters = async () => {
        if (!selectedInterview || panelRecruiters.length === 0) {
            toast.error("Please select at least one recruiter");
            return;
        }

        setInviting(true);
        try {
            const res = await fetch(`/api/interviews/${selectedInterview.id}/add-recruiters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recruiterIds: panelRecruiters.map(r => r.id)
                })
            });

            if (!res.ok) throw new Error('Failed to invite recruiters');

            toast.success(`Invited ${panelRecruiters.length} recruiter(s) successfully!`);
            setShowInviteModal(false);
            setPanelRecruiters([]);
            fetchInterviews(); // Refresh the list
        } catch (error) {
            console.error(error);
            toast.error('Failed to invite recruiters');
        } finally {
            setInviting(false);
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
                <h1 className="text-3xl font-bold">Scheduled Interviews</h1>
                <p className="text-muted-foreground mt-1">Manage your upcoming video interviews</p>
            </div>

            {interviews.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                            <Video className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold">No interviews scheduled</h3>
                        <p className="text-muted-foreground max-w-sm mt-2">
                            Schedule interviews from the candidate's application page.
                        </p>
                        <Button className="mt-4" asChild>
                            <Link href="/dashboard/recruiter/applications">View Applications</Link>
                        </Button>
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
                                                    {interview.application.user.name}
                                                    <Badge variant="secondary" className={getStatusColor(interview.status)}>
                                                        {interview.status}
                                                    </Badge>
                                                </h3>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Briefcase className="h-3 w-3" /> {interview.application.job.title}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> {interview.duration} mins
                                                    </span>
                                                </div>

                                                {/* Panel Members */}
                                                {interview.participants && interview.participants.length > 1 && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Users className="h-3 w-3 text-muted-foreground" />
                                                        <div className="flex -space-x-2">
                                                            {interview.participants
                                                                .filter(p => p.role !== 'CANDIDATE')
                                                                .slice(0, 3)
                                                                .map((participant) => (
                                                                    <Avatar key={participant.id} className="h-6 w-6 border-2 border-background">
                                                                        <AvatarImage src={participant.user.photoUrl} />
                                                                        <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                                                                            {participant.user.name?.charAt(0) || 'R'}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                ))}
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {interview.participants.filter(p => p.role !== 'CANDIDATE').length} interviewer(s)
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/dashboard/recruiter/applications/${interview.application.id}`}>
                                                        View Application
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openInviteModal(interview)}
                                                >
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Invite Recruiter
                                                </Button>
                                                {(interview.status === "SCHEDULED" || interview.status === "ACCEPTED") && (
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

            {/* Invite Recruiter Modal */}
            <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Invite Recruiters to Interview Panel</DialogTitle>
                        <DialogDescription>
                            {selectedInterview && (
                                <>
                                    Interview with <strong>{selectedInterview.application.user.name}</strong> for{" "}
                                    <strong>{selectedInterview.application.job.title}</strong>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <RecruiterSearch
                            selectedRecruiters={panelRecruiters}
                            onSelect={(recruiter) => setPanelRecruiters([...panelRecruiters, recruiter])}
                            onRemove={(id) => setPanelRecruiters(panelRecruiters.filter(r => r.id !== id))}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={inviteRecruiters}
                            disabled={inviting || panelRecruiters.length === 0}
                        >
                            {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Invite {panelRecruiters.length > 0 && `(${panelRecruiters.length})`}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
