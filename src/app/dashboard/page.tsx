"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
    const router = useRouter();

    useEffect(() => {
        const redirectToRoleDashboard = async () => {
            try {
                const res = await fetch("/api/user/check");
                if (res.ok) {
                    const data = await res.json();

                    if (!data.exists) {
                        // User doesn't exist in DB, redirect to sync
                        router.push("/sync");
                        return;
                    }

                    // Redirect based on role
                    switch (data.role) {
                        case "ADMIN":
                            router.push("/dashboard/admin");
                            break;
                        case "RECRUITER":
                            router.push("/dashboard/recruiter");
                            break;
                        case "JOB_SEEKER":
                        default:
                            router.push("/dashboard/job-seeker");
                            break;
                    }
                } else {
                    // If check fails, default to job seeker
                    router.push("/dashboard/job-seeker");
                }
            } catch (error) {
                console.error("Error checking user role:", error);
                router.push("/dashboard/job-seeker");
            }
        };

        redirectToRoleDashboard();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Redirecting to your dashboard...</p>
            </div>
        </div>
    );
}
