"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
    const { user } = useUser();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

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
                    role,
                }),
            });

            if (!response.ok) throw new Error("Failed to create user");

            toast.success("Profile created successfully!");
            router.push(role === "JOB_SEEKER" ? "/dashboard/job-seeker" : "/dashboard/recruiter");
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

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
