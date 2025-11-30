"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Loader2, Save, User as UserIcon, Camera, Award, FileText, Crown } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/use-subscription";
import { Badge } from "@/components/ui/badge";

const COUNTRIES = [
    "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "India",
    "China", "Japan", "Brazil", "Mexico", "Spain", "Italy", "Netherlands", "Sweden",
    "Switzerland", "Singapore", "South Korea", "Russia", "Poland", "Turkey", "Indonesia",
    "Thailand", "Malaysia", "Philippines", "Vietnam", "Bangladesh", "Pakistan", "Egypt",
    "South Africa", "Nigeria", "Kenya", "Argentina", "Chile", "Colombia", "Peru",
    "New Zealand", "Ireland", "Denmark", "Norway", "Finland", "Belgium", "Austria",
    "Portugal", "Greece", "Czech Republic", "Romania", "Hungary", "Ukraine", "Other"
];

interface UserProfile {
    name: string;
    email: string;
    country: string;
    photoUrl?: string;
    autoApply: boolean;
    matchThreshold: number; // 0-100 percentage
    autoApplyCountry: string; // optional country filter for auto-apply
    warningCount: number;
}

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile>({
        name: "",
        email: "",
        country: "",
        photoUrl: "",
        autoApply: false,
        matchThreshold: 95,
        autoApplyCountry: "",
        warningCount: 0,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resumeScore, setResumeScore] = useState<number | null>(null);
    const [resumeCount, setResumeCount] = useState(0);
    const [isPro, setIsPro] = useState(false);
    const { subscribe, loading: subscribing } = useSubscription();

    useEffect(() => {
        fetchProfile();
        fetchResumeStats();
        fetchSubscriptionStatus();
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
                    autoApply: data.autoApply || false,
                    matchThreshold: data.matchThreshold ?? 95,
                    autoApplyCountry: data.autoApplyCountry || "",
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

    const fetchResumeStats = async () => {
        try {
            const res = await fetch("/api/resumes");
            if (res.ok) {
                const data = await res.json();
                setResumeCount(data.resumes?.length || 0);
                // Calculate average score if resumes have scores
                if (data.resumes && data.resumes.length > 0) {
                    // For now, set a mock score - you can implement actual scoring logic
                    setResumeScore(75);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchSubscriptionStatus = async () => {
        try {
            const res = await fetch("/api/user/subscription");
            if (res.ok) {
                const data = await res.json();
                setIsPro(data.subscription?.status === 'ACTIVE' && data.subscription?.plan === 'PRO');
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

        // Check if trying to enable auto-apply without Pro
        if (profile.autoApply && !isPro) {
            toast.error("Auto-Apply is a Pro feature! Upgrade to enable it.");
            setProfile({ ...profile, autoApply: false });
            return;
        }

        // Ensure matchThreshold is within 0-100
        if (profile.matchThreshold < 0 || profile.matchThreshold > 100) {
            toast.error("Match threshold must be between 0 and 100");
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
                    autoApply: profile.autoApply,
                    matchThreshold: profile.matchThreshold,
                    autoApplyCountry: profile.autoApplyCountry,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to update profile");
            }

            const updatedData = await res.json();

            toast.success("Profile updated successfully!");

            // Update local state with server response
            setProfile({
                ...profile,
                ...updatedData,
            });

            // Redirect to dashboard after successful save
            setTimeout(() => {
                router.push("/dashboard/job-seeker");
            }, 1000); // Small delay to show success message
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
                <h1 className="text-3xl font-bold">Profile Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Resume Score</CardDescription>
                        <CardTitle className="text-3xl flex items-center gap-2">
                            {resumeScore ? `${resumeScore}%` : "N/A"}
                            <Award className="h-6 w-6 text-yellow-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {resumeScore && <Progress value={resumeScore} className="h-2" />}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Resumes Created</CardDescription>
                        <CardTitle className="text-3xl flex items-center gap-2">
                            {resumeCount}
                            <FileText className="h-6 w-6 text-blue-500" />
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Profile Completion</CardDescription>
                        <CardTitle className="text-3xl">
                            {profile.country && profile.name ? "100%" : profile.name || profile.country ? "50%" : "0%"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Progress value={profile.country && profile.name ? 100 : profile.name || profile.country ? 50 : 0} className="h-2" />
                    </CardContent>
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
                            <Select value={profile.country} onValueChange={(value) => setProfile({ ...profile, country: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your country" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {COUNTRIES.map((country) => (
                                        <SelectItem key={country} value={country}>
                                            {country}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {!profile.country && (
                                <p className="text-xs text-red-500">Country is required to complete your profile</p>
                            )}
                        </div>

                        {/* Auto-Apply Toggle */}
                        <div className={`space-y-3 p-4 rounded-lg border ${isPro ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' : 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="autoApply" className={`text-base font-semibold ${isPro ? 'text-blue-900 dark:text-blue-100' : 'text-amber-900 dark:text-amber-100'}`}>
                                            {isPro ? '🚀' : <Crown className="h-4 w-4 inline" />} Enable Auto-Apply
                                        </Label>
                                        {!isPro && (
                                            <Badge variant="secondary" className="text-[10px] bg-amber-200 text-amber-900">
                                                PRO
                                            </Badge>
                                        )}
                                    </div>
                                    <p className={`text-sm mt-1 ${isPro ? 'text-blue-800 dark:text-blue-200' : 'text-amber-800 dark:text-amber-200'}`}>
                                        {isPro
                                            ? 'Automatically apply to jobs that match your profile and resume (95-100% match). Save time and never miss an opportunity!'
                                            : 'Upgrade to Pro to automatically apply to hundreds of matching jobs!'
                                        }
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="autoApply"
                                        checked={profile.autoApply}
                                        disabled={!isPro}
                                        onChange={(e) => setProfile({ ...profile, autoApply: e.target.checked })}
                                        className={`w-12 h-6 rounded-full appearance-none cursor-pointer relative transition-colors
                                                   before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white
                                                   before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6
                                                   ${isPro ? 'bg-gray-300 checked:bg-blue-600' : 'bg-gray-300 opacity-50 cursor-not-allowed'}`}
                                    />
                                </div>
                            </div>
                            {!isPro && (
                                <div className="pt-3 border-t border-amber-200 dark:border-amber-800">
                                    <Button
                                        type="button"
                                        onClick={() => subscribe('PRO', 299)}
                                        disabled={subscribing}
                                        size="sm"
                                        className="w-full bg-amber-600 hover:bg-amber-700"
                                    >
                                        <Crown className="h-3 w-3 mr-1" />
                                        {subscribing ? 'Processing...' : 'Upgrade to Pro - ৳299/month'}
                                    </Button>
                                </div>
                            )}
                            {isPro && profile.autoApply && (
                                <>
                                    <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 p-2 rounded">
                                        ✓ Auto-apply is enabled. We'll apply to matching jobs on your behalf using your default resume.
                                    </div>

                                    {/* Match Threshold Slider */}
                                    <div className="mt-4">
                                        <Label htmlFor="matchThreshold" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Match Threshold (%)</Label>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <input
                                                id="matchThreshold"
                                                type="range"
                                                min={0}
                                                max={100}
                                                step={1}
                                                value={profile.matchThreshold}
                                                onChange={(e) => setProfile({ ...profile, matchThreshold: Number(e.target.value) })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                                            />
                                            <span className="w-12 text-center text-sm">{profile.matchThreshold}%</span>
                                        </div>
                                    </div>

                                    {/* Auto-Apply Country Select (shown when auto-apply is enabled) */}
                                    <div className="mt-4">
                                        <Label htmlFor="autoApplyCountry" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Apply To Country</Label>
                                        <Select
                                            value={profile.autoApplyCountry}
                                            onValueChange={(value) => setProfile({ ...profile, autoApplyCountry: value })}
                                        >
                                            <SelectTrigger id="autoApplyCountry" className="w-full mt-1">
                                                <SelectValue placeholder="Select country" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {COUNTRIES.map((c) => (
                                                    <SelectItem key={c} value={c}>
                                                        {c}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
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
