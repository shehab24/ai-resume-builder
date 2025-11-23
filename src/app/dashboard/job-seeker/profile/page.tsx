"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, User } from "lucide-react";

export default function ProfilePage() {
    const { user, isLoaded } = useUser();
    const [isSaving, setIsSaving] = useState(false);

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <div className="text-center py-12">Please sign in to view your profile</div>;
    }

    const handleUpdateProfile = async () => {
        setIsSaving(true);
        try {
            // Clerk handles profile updates through their UI
            toast.info("Please use the profile button in the header to update your account details");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Profile Settings</h1>
                <p className="text-muted-foreground">Manage your account information</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Account Information
                    </CardTitle>
                    <CardDescription>
                        Your account is managed by Clerk. Click your profile picture in the header to update your details.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                            value={user.primaryEmailAddress?.emailAddress || ""}
                            disabled
                            className="bg-gray-50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input
                            value={user.fullName || ""}
                            disabled
                            className="bg-gray-50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                            value={user.username || "Not set"}
                            disabled
                            className="bg-gray-50"
                        />
                    </div>

                    <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-4">
                            To update your profile information, click on your profile picture in the top right corner of the page.
                        </p>
                        <Button variant="outline" onClick={handleUpdateProfile}>
                            View Update Instructions
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Account Type</CardTitle>
                    <CardDescription>Your current role in the platform</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                        <div>
                            <p className="font-semibold">Job Seeker</p>
                            <p className="text-sm text-muted-foreground">
                                You have access to resume building and job search features
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                        Note: To switch roles, please sign out and create a new account with the desired role.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
