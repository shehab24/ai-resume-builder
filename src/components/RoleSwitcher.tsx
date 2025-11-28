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
import { RefreshCw, Briefcase, User } from "lucide-react";
import { toast } from "sonner";

export function RoleSwitcher() {
    const [currentRole, setCurrentRole] = useState<string | null>(null);
    const [switching, setSwitching] = useState(false);

    useEffect(() => {
        fetchCurrentRole();
    }, []);

    const fetchCurrentRole = async () => {
        try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
                const data = await res.json();
                setCurrentRole(data.role);
            }
        } catch (error) {
            console.error("Failed to fetch role:", error);
        }
    };

    const handleSwitchRole = async (newRole: string) => {
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

    return (
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
    );
}
