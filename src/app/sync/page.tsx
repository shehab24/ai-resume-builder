"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SyncPage() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const router = useRouter();

    const syncUser = async () => {
        setStatus("loading");
        try {
            const res = await fetch("/api/user/sync", {
                method: "POST",
            });

            const data = await res.json();

            if (res.ok) {
                setStatus("success");
                setMessage(`Account synced successfully! Email: ${data.user.email}`);
                setTimeout(() => {
                    router.push("/dashboard/job-seeker");
                }, 2000);
            } else {
                setStatus("error");
                setMessage(data.error || "Failed to sync account");
            }
        } catch (error) {
            setStatus("error");
            setMessage("Network error occurred");
        }
    };

    useEffect(() => {
        // Auto-sync on page load
        syncUser();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle>Account Sync</CardTitle>
                    <CardDescription>
                        Syncing your account with the database...
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status === "loading" && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <CheckCircle className="h-12 w-12 text-green-600" />
                            <p className="text-center text-green-700 dark:text-green-400">{message}</p>
                            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <AlertCircle className="h-12 w-12 text-red-600" />
                            <p className="text-center text-red-700 dark:text-red-400">{message}</p>
                            <Button onClick={syncUser}>Try Again</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
