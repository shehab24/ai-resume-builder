"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, MapPin, DollarSign, Zap, Briefcase, Calendar, ExternalLink, Clock, Crown, Users, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { useSubscription } from "@/hooks/use-subscription";
import { useRouter } from "next/navigation";

interface Job {
    id: string;
    title: string;
    description: string;
    location: string;
    salary: string;
    requirements: string[];
    createdAt: string;
    isExternal?: boolean;
    externalUrl?: string;
    applicationMethod?: string;
    applicationEmail?: string;
    company?: string;
    recruiter: { name: string };
    recruiterId?: string;
    source?: { name: string };
}

export default function FindJobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoApply, setAutoApply] = useState(false);
    const [updatingAutoApply, setUpdatingAutoApply] = useState(false);
    const [isPro, setIsPro] = useState(false);
    const { subscribe, loading: subscribing } = useSubscription();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showSwitchDialog, setShowSwitchDialog] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [switchingRole, setSwitchingRole] = useState(false);

    const [matchThreshold, setMatchThreshold] = useState(95);

    useEffect(() => {
        // Fetch user profile first, then jobs
        const initializeData = async () => {
            await fetchAutoApplyStatus(); // This sets currentUserId
            await fetchJobs();
            await fetchSubscriptionStatus();
        };
        initializeData();
    }, []);

    // Debug: Log when currentUserId changes
    useEffect(() => {
        console.log("[Frontend] currentUserId changed to:", currentUserId);
    }, [currentUserId]);

    // Debug: Log when jobs change
    useEffect(() => {
        console.log("[Frontend] jobs changed, count:", jobs.length);
        if (jobs.length > 0 && currentUserId) {
            console.log("[Frontend] Sample job recruiterId:", jobs[0].recruiterId);
            console.log("[Frontend] Current userId:", currentUserId);
            console.log("[Frontend] Match?", jobs[0].recruiterId === currentUserId);
        }
    }, [jobs, currentUserId]);

    const fetchJobs = async () => {
        try {
            const response = await fetch("/api/jobs/match");
            if (!response.ok) throw new Error("Failed to fetch jobs");
            const data = await response.json();
            console.log("[Frontend] Received jobs:", data.length);
            setJobs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAutoApplyStatus = async () => {
        try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
                const data = await res.json();
                setAutoApply(data.autoApply || false);
                setMatchThreshold(data.matchThreshold || 95);
                setCurrentUserId(data.id); // Get current user ID
                console.log("[Frontend] Current User ID:", data.id);
            }
        } catch (error) {
            console.error(error);
        }
    };

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

    const handleAutoApplyToggle = async (checked: boolean) => {
        if (!isPro && checked) {
            toast.error("Auto-Apply is a Pro feature! Upgrade to enable it.");
            return;
        }

        setUpdatingAutoApply(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ autoApply: checked }),
            });

            if (!res.ok) throw new Error("Failed to update auto-apply");

            setAutoApply(checked);
            toast.success(checked ? "Auto-Apply enabled! 🚀" : "Auto-Apply disabled");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update auto-apply setting");
        } finally {
            setUpdatingAutoApply(false);
        }
    };

    const handleSwitchToRecruiter = async () => {
        setSwitchingRole(true);
        try {
            const res = await fetch("/api/user/switch-role", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newRole: "RECRUITER" }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Switched to Recruiter role!");
                // Redirect to applications page
                window.location.href = `/dashboard/recruiter/jobs/${selectedJobId}/applications`;
            } else {
                toast.error(data.error || "Failed to switch role");
            }
        } catch (error) {
            console.error("Error switching role:", error);
            toast.error("Failed to switch role");
        } finally {
            setSwitchingRole(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Available Jobs
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Browse {jobs.length} jobs that match your profile
                    </p>
                </div>

                {/* Auto-Apply Toggle */}
                <Card className={`border-2 shadow-lg ${isPro ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950' : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950'}`}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            {isPro ? (
                                <Zap className="h-5 w-5 text-blue-600" />
                            ) : (
                                <Crown className="h-5 w-5 text-amber-600" />
                            )}
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className={`font-semibold text-sm ${isPro ? 'text-blue-900 dark:text-blue-100' : 'text-amber-900 dark:text-amber-100'}`}>
                                        Auto-Apply
                                    </p>
                                    {!isPro && (
                                        <Badge variant="secondary" className="text-[10px] bg-amber-200 text-amber-900">
                                            PRO
                                        </Badge>
                                    )}
                                </div>
                                <p className={`text-xs ${isPro ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                    {isPro ? (autoApply ? "Enabled" : "Disabled") : "Upgrade to Pro to enable"}
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={autoApply}
                                disabled={updatingAutoApply || !isPro}
                                onChange={(e) => handleAutoApplyToggle(e.target.checked)}
                                className={`w-12 h-6 rounded-full appearance-none relative transition-colors
                                           before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white 
                                           before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6
                                           disabled:opacity-50 disabled:cursor-not-allowed
                                           ${isPro ? 'bg-gray-300 checked:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'}`}
                            />
                        </div>
                        {isPro && autoApply && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                ✓ We'll auto-apply to {matchThreshold}%+ matching jobs
                            </p>
                        )}
                        {!isPro && (
                            <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                                <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                                    Unlock Auto-Apply and apply to hundreds of jobs automatically!
                                </p>
                                <Button
                                    onClick={() => subscribe('PRO', 299)}
                                    disabled={subscribing}
                                    size="sm"
                                    className="w-full bg-amber-600 hover:bg-amber-700"
                                >
                                    <Crown className="h-3 w-3 mr-1" />
                                    {subscribing ? 'Processing...' : 'Upgrade to Pro - ৳299/month'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {jobs.length === 0 ? (
                <div className="text-center py-12">
                    <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Jobs Found</h3>
                    <p className="text-muted-foreground">
                        No jobs found matching your profile. Check back later!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {jobs.map((job) => {
                        const isOwnJob = job.recruiterId === currentUserId;

                        // Debug logging
                        if (job.recruiterId && currentUserId) {
                            console.log(`Job: ${job.title}, RecruiterId: ${job.recruiterId}, CurrentUserId: ${currentUserId}, Match: ${isOwnJob}`);
                        }

                        return (
                            <Card key={job.id} className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden flex flex-col">
                                {/* Gradient Header */}
                                <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

                                <CardContent className="p-6 flex-1 flex flex-col">
                                    {/* Title */}
                                    <div className="space-y-3 flex-1">
                                        {/* Badges Row */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* External Job Badge */}
                                            {job.isExternal && (
                                                <Badge variant="outline" className="w-fit bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300">
                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                    {job.source?.name || 'External Job'}
                                                </Badge>
                                            )}
                                            {/* Your Job Post Badge */}
                                            {isOwnJob && (
                                                <Badge variant="secondary" className="w-fit bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300">
                                                    <Briefcase className="h-3 w-3 mr-1" />
                                                    Your Job Post
                                                </Badge>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                                            {job.title}
                                        </h3>

                                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                            {job.description}
                                        </p>

                                        {/* Job Details */}
                                        <div className="flex flex-wrap gap-3 text-sm pt-2">
                                            {job.location && (
                                                <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    <span className="font-medium">{job.location}</span>
                                                </div>
                                            )}
                                            {job.salary && (
                                                <div className="flex items-center gap-1.5 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full">
                                                    <DollarSign className="h-3.5 w-3.5" />
                                                    <span className="font-medium">{job.salary}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Skills */}
                                        <div className="flex flex-wrap gap-2">
                                            {job.requirements.slice(0, 3).map((req, index) => (
                                                <Badge key={index} variant="secondary" className="text-xs font-medium max-w-[200px] truncate block">
                                                    {req}
                                                </Badge>
                                            ))}
                                            {job.requirements.length > 3 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    +{job.requirements.length - 3}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Date */}
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                                            <Clock className="h-3 w-3" />
                                            <span>Posted {new Date(job.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}</span>
                                            <span className="mx-1">•</span>
                                            <span>{job.company || job.recruiter?.name}</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="pt-4">
                                        {isOwnJob ? (
                                            <div className="space-y-2">
                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                                                            <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-blue-900 dark:text-blue-100">Your Job Post</p>
                                                            <p className="text-xs text-blue-700 dark:text-blue-300">You posted this position</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                                        onClick={() => {
                                                            setSelectedJobId(job.id);
                                                            setShowSwitchDialog(true);
                                                        }}
                                                    >
                                                        <Users className="h-4 w-4 mr-2" />
                                                        View Applications
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : job.isExternal ? (
                                            <Button
                                                className="w-full shadow-md hover:shadow-lg transition-shadow bg-purple-600 hover:bg-purple-700"
                                                onClick={() => {
                                                    if (job.applicationMethod === "EMAIL" && job.applicationEmail) {
                                                        window.location.href = `mailto:${job.applicationEmail}`;
                                                    } else if (job.externalUrl) {
                                                        window.open(job.externalUrl, "_blank");
                                                    }
                                                }}
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Apply on Company Site
                                            </Button>
                                        ) : (
                                            <Button
                                                asChild
                                                className="w-full shadow-md hover:shadow-lg transition-shadow"
                                            >
                                                <Link href={`/dashboard/job-seeker/jobs/${job.id}`}>
                                                    <Zap className="h-4 w-4 mr-2 fill-current" />
                                                    View & Apply
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Switch Role Dialog */}
            <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                            Switch to Recruiter Role
                        </DialogTitle>
                        <DialogDescription>
                            To view applications for this job, you need to switch to your Recruiter role.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                                You'll be switched to Recruiter mode and redirected to the applications page for this job.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowSwitchDialog(false)}
                            disabled={switchingRole}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSwitchToRecruiter}
                            disabled={switchingRole}
                        >
                            {switchingRole ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Switching...
                                </>
                            ) : (
                                <>
                                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                                    Switch & View Applications
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
