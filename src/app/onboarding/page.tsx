"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
    const { user } = useUser();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [checkingRole, setCheckingRole] = useState(true);

    // Check if user already has a role
    useEffect(() => {
        const checkExistingRole = async () => {
            try {
                const res = await fetch("/api/user/check");
                if (res.ok) {
                    const data = await res.json();

                    console.log("[Onboarding] User check response:", data);

                    // If user exists and has a role, redirect to their dashboard
                    if (data.exists && data.role) {
                        console.log("[Onboarding] User has role:", data.role);
                        if (data.role === "ADMIN") {
                            console.log("[Onboarding] Redirecting to admin dashboard");
                            router.push("/dashboard/admin");
                        } else if (data.role === "RECRUITER") {
                            console.log("[Onboarding] Redirecting to recruiter dashboard");
                            router.push("/dashboard/recruiter");
                        } else {
                            console.log("[Onboarding] Redirecting to job seeker dashboard");
                            router.push("/dashboard/job-seeker");
                        }
                        return;
                    } else {
                        console.log("[Onboarding] User does not exist or has no role");
                    }
                } else {
                    console.error("[Onboarding] API check failed:", res.status);
                }
            } catch (error) {
                console.error("Error checking role:", error);
            } finally {
                setCheckingRole(false);
            }
        };

        if (user) {
            console.log("[Onboarding] Clerk user loaded, checking role...");
            checkExistingRole();
        } else {
            console.log("[Onboarding] No Clerk user yet");
        }
    }, [user, router]);

    const handleRoleSelection = async (role: "JOB_SEEKER" | "RECRUITER") => {
        if (!user) {
            toast.error("Please wait for authentication to complete");
            return;
        }
        setIsLoading(true);

        try {
            // Always create user as JOB_SEEKER initially
            // If they want to be a recruiter, they'll fill the onboarding form
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

            toast.success("Profile created successfully!");

            // If they chose recruiter, send them to recruiter onboarding
            // Otherwise, send to job seeker dashboard
            if (role === "RECRUITER") {
                router.push("/recruiter-onboarding");
            } else {
                router.push("/dashboard/job-seeker");
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading while checking role
    if (checkingRole) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
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
