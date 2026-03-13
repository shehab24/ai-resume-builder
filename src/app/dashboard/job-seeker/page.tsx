import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@/components/dashboard/subscription-status";

export default async function JobSeekerDashboard() {
    const { userId } = await auth();

    if (!userId) return null;

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
            subscriptions: {
                where: { status: 'ACTIVE' },
                orderBy: { endDate: 'desc' },
                take: 1
            }
        }
    });

    const subscription = user?.subscriptions?.[0];


    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <SubscriptionStatus subscription={subscription} />

                <Card>
                    <CardHeader>
                        <CardTitle>My Resumes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">You haven't created any resumes yet.</p>
                        <Button asChild>
                            <Link href="/dashboard/job-seeker/resume/create">Create New Resume</Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Job Matches</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Complete your profile to see job matches.</p>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/job-seeker/profile">Update Profile</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
