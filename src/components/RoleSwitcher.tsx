"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw, Briefcase, User, Clock, XCircle, Info, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function RoleSwitcher() {
    const router = useRouter();
    const [currentRole, setCurrentRole] = useState<string | null>(null);
    const [recruiterStatus, setRecruiterStatus] = useState<string | null>(null);
    const [switching, setSwitching] = useState(false);
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [dialogType, setDialogType] = useState<"pending" | "rejected" | null>(null);

    useEffect(() => {
        fetchCurrentRole();
    }, []);

    const fetchCurrentRole = async () => {
        try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
                const data = await res.json();
                setCurrentRole(data.role);
                setRecruiterStatus(data.recruiterStatus);
            }
        } catch (error) {
            console.error("Failed to fetch role:", error);
        }
    };

    const handleSwitchRole = async (newRole: string) => {
        // If switching to recruiter, check status first
        if (newRole === "RECRUITER") {
            if (recruiterStatus === "NONE") {
                // Redirect to onboarding
                router.push("/recruiter-onboarding");
                return;
            } else if (recruiterStatus === "PENDING") {
                setDialogType("pending");
                setShowStatusDialog(true);
                return;
            } else if (recruiterStatus === "REJECTED") {
                setDialogType("rejected");
                setShowStatusDialog(true);
                return;
            } else if (recruiterStatus !== "APPROVED") {
                toast.error("Please submit a recruiter application first");
                router.push("/recruiter-onboarding");
                return;
            }
        }

        setSwitching(true);
        try {
            const res = await fetch("/api/user/switch-role", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newRole }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Role switched successfully! Redirecting...");
                setTimeout(() => {
                    window.location.href = data.redirectTo;
                }, 1000);
            } else {
                toast.error(data.error || "Failed to switch role");
                setSwitching(false);
            }
        } catch (error) {
            console.error("Error switching role:", error);
            toast.error("Failed to switch role");
            setSwitching(false);
        }
    };

    // Don't show for admins or if role not loaded
    if (!currentRole || currentRole === "ADMIN") {
        return null;
    }

    const isJobSeeker = currentRole === "JOB_SEEKER";
    const targetRole = isJobSeeker ? "RECRUITER" : "JOB_SEEKER";
    const targetLabel = isJobSeeker ? "Recruiter" : "Job Seeker";

    // Show status badge if recruiter application exists
    const showRecruiterStatus = isJobSeeker && recruiterStatus && recruiterStatus !== "NONE";

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        {isJobSeeker ? (
                            <>
                                <User className="h-4 w-4" />
                                Job Seeker
                            </>
                        ) : (
                            <>
                                <Briefcase className="h-4 w-4" />
                                Recruiter
                            </>
                        )}
                        <RefreshCw className="h-3 w-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Current Role</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="font-medium">
                        {isJobSeeker ? (
                            <>
                                <User className="mr-2 h-4 w-4" />
                                Job Seeker (Active)
                            </>
                        ) : (
                            <>
                                <Briefcase className="mr-2 h-4 w-4" />
                                Recruiter (Active)
                            </>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />

                    {showRecruiterStatus && (
                        <>
                            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                                {recruiterStatus === "PENDING" && (
                                    <>
                                        <Clock className="mr-2 h-3 w-3 text-amber-500" />
                                        Recruiter: Pending Approval
                                    </>
                                )}
                                {recruiterStatus === "REJECTED" && (
                                    <>
                                        <XCircle className="mr-2 h-3 w-3 text-red-500" />
                                        Recruiter: Not Approved
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}

                    <DropdownMenuItem
                        onClick={() => handleSwitchRole(targetRole)}
                        disabled={switching}
                        className="cursor-pointer"
                    >
                        {switching ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Switching...
                            </>
                        ) : (
                            <>
                                {isJobSeeker ? (
                                    <Briefcase className="mr-2 h-4 w-4" />
                                ) : (
                                    <User className="mr-2 h-4 w-4" />
                                )}
                                Switch to {targetLabel}
                            </>
                        )}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Application Status Dialog */}
            <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {dialogType === "pending" ? (
                                <>
                                    <Clock className="h-5 w-5 text-amber-500" />
                                    Application Under Review
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-5 w-5 text-red-500" />
                                    Application Not Approved
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogType === "pending" ? (
                                "Your recruiter application is currently being reviewed by our admin team."
                            ) : (
                                "Your recruiter application was not approved. Please contact support for more information."
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {dialogType === "pending" ? (
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-blue-900">What's happening?</p>
                                        <p className="text-blue-700 mt-1">
                                            Our team is verifying your company information. This usually takes 1-2 business days.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-green-900">You can still use the platform</p>
                                        <p className="text-green-700 mt-1">
                                            Continue using all job seeker features while you wait for approval.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-900">
                                    If you believe this was a mistake, please contact our support team at support@example.com
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
