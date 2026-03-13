"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [checkingRole, setCheckingRole] = useState(true);

    // Check if user already has a role — retry up to 3 times to handle
    // Clerk session not being immediately ready after the force redirect
    useEffect(() => {
        if (!user) return;

        let attempts = 0;
        const MAX = 3;

        const checkExistingRole = async (): Promise<void> => {
            attempts++;
            try {
                const res = await fetch("/api/user/check");

                if (res.status === 401 && attempts < MAX) {
                    // Clerk session not ready yet — wait and retry
                    await new Promise(r => setTimeout(r, 800 * attempts));
                    return checkExistingRole();
                }

                if (res.ok) {
                    const data = await res.json();
                    console.log("[Onboarding] User check response:", data);

                    if (data.exists && data.role) {
                        // Hard navigation — breaks Clerk's force-redirect loop
                        if (data.role === "ADMIN")          window.location.href = "/dashboard/admin";
                        else if (data.role === "RECRUITER") window.location.href = "/dashboard/recruiter";
                        else                                window.location.href = "/dashboard/job-seeker";
                        return;
                    }
                }
            } catch (error) {
                console.error("[Onboarding] check error:", error);
                if (attempts < MAX) {
                    await new Promise(r => setTimeout(r, 800 * attempts));
                    return checkExistingRole();
                }
            }
            // All retries exhausted or user genuinely doesn't exist — show role picker
            setCheckingRole(false);
        };

        checkExistingRole();
    }, [user]);




    const handleRoleSelection = async (role: "JOB_SEEKER" | "RECRUITER") => {
        if (!user) {
            toast.error("Please wait for authentication to complete");
            return;
        }
        setIsLoading(true);

        try {
            const response = await fetch("/api/user/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clerkId: user.id,
                    email: user.primaryEmailAddress?.emailAddress,
                    name: user.fullName,
                    role: "JOB_SEEKER", // Always start as job seeker
                }),
            });

            if (!response.ok) throw new Error("Failed to create user");

            toast.success("Profile created!");

            // Use hard navigation so Clerk's force-redirect doesn't intercept
            if (role === "RECRUITER") {
                window.location.href = "/recruiter-onboarding";
            } else {
                window.location.href = "/dashboard/job-seeker";
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again.");
            setIsLoading(false);
        }

    };


    // Hard-timeout: if still loading after 10s, show role picker
    useEffect(() => {
        const t = setTimeout(() => setCheckingRole(false), 10_000);
        return () => clearTimeout(t);
    }, []);

    // Show loading while checking role
    if (checkingRole) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Setting up your account…</p>
                    <p className="text-gray-400 text-sm mt-1">This only takes a moment</p>
                </div>
            </div>
        );
    }


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Welcome to AI Resume Maker</CardTitle>
                    <CardDescription>Choose how you want to use the app</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Button
                        variant="outline"
                        className="h-24 text-lg"
                        onClick={() => handleRoleSelection("JOB_SEEKER")}
                        disabled={isLoading}
                    >
                        I am a Job Seeker
                    </Button>
                    <Button
                        variant="outline"
                        className="h-24 text-lg"
                        onClick={() => handleRoleSelection("RECRUITER")}
                        disabled={isLoading}
                    >
                        I am a Recruiter
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
