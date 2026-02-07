"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CountrySelect } from "@/components/CountrySelect";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, User as UserIcon, Camera, Briefcase, Users } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
    name: string;
    email: string;
    country: string;
    photoUrl?: string;
    warningCount: number;
}

export default function RecruiterProfilePage() {
    const [profile, setProfile] = useState<UserProfile>({
        name: "",
        email: "",
        country: "",
        photoUrl: "",
        warningCount: 0,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [jobCount, setJobCount] = useState(0);
    const [applicationCount, setApplicationCount] = useState(0);

    useEffect(() => {
        fetchProfile();
        fetchStats();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
                const data = await res.json();
                setProfile({
                    name: data.name || "",
                    email: data.email || "",
                    country: data.country || "",
                    photoUrl: data.photoUrl || "",
                    warningCount: data.warningCount || 0,
                });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/recruiter/stats");
            if (res.ok) {
                const data = await res.json();
                setJobCount(data.totalJobs || 0);
                setApplicationCount(data.totalApplications || 0);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!profile.country) {
            toast.error("Please select your country");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: profile.name,
                    country: profile.country,
                    photoUrl: profile.photoUrl,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to update profile");
            }

            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update profile");
        } finally {
            setSaving(false);
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
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Recruiter Profile</h1>
                <p className="text-muted-foreground mt-2">Manage your recruiter account and preferences</p>
            </div>

            {/* Warning Banner */}
            {profile.warningCount > 0 && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-orange-900 dark:text-orange-100 text-lg">
                                    ⚠️ Account Warning
                                </h3>
                                <p className="text-sm text-orange-800 dark:text-orange-200 mt-2">
                                    You have received <strong>{profile.warningCount}</strong> warning{profile.warningCount > 1 ? 's' : ''} for violating our community guidelines.
                                    Please review our terms of service and ensure compliance to avoid account suspension.
                                </p>
                                <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                                    Check your notifications for details about the warnings.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Profile Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Posted Jobs</CardDescription>
                        <CardTitle className="text-3xl flex items-center gap-2">
                            {jobCount}
                            <Briefcase className="h-6 w-6 text-blue-500" />
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Applications</CardDescription>
                        <CardTitle className="text-3xl flex items-center gap-2">
                            {applicationCount}
                            <Users className="h-6 w-6 text-green-500" />
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Profile Photo */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Profile Photo
                    </CardTitle>
                    <CardDescription>
                        Enter an image URL for your profile photo
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={profile.photoUrl} />
                            <AvatarFallback className="text-2xl">
                                {profile.name?.charAt(0)?.toUpperCase() || profile.email?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="photo-url">Image URL</Label>
                            <Input
                                id="photo-url"
                                type="url"
                                placeholder="https://example.com/your-photo.jpg"
                                value={profile.photoUrl || ""}
                                onChange={(e) => setProfile({ ...profile, photoUrl: e.target.value })}
                                className="max-w-md"
                            />
                            <p className="text-xs text-muted-foreground">
                                Paste a URL to an image (e.g., from Imgur, your website, or any public image URL)
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                        Personal Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={profile.email}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="country">
                                Country <span className="text-red-500">*</span>
                            </Label>
                            <CountrySelect
                                value={profile.country}
                                onValueChange={(value) => setProfile({ ...profile, country: value })}
                                placeholder="Select your country"
                            />
                            {!profile.country && (
                                <p className="text-xs text-red-500">Country is required to complete your profile</p>
                            )}
                        </div>

                        <Button type="submit" disabled={saving} className="w-full">
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
