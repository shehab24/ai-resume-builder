"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Loader2, Save, User as UserIcon, Upload, Camera, Award, FileText } from "lucide-react";
import { toast } from "sonner";

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
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile>({
        name: "",
        email: "",
        country: "",
        photoUrl: "",
        autoApply: false,
        matchThreshold: 95,
        autoApplyCountry: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [resumeScore, setResumeScore] = useState<number | null>(null);
    const [resumeCount, setResumeCount] = useState(0);

    useEffect(() => {
        fetchProfile();
        fetchResumeStats();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!profile.country) {
            toast.error("Please select your country");
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
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        setUploadingPhoto(true);
        try {
            // For now, create a local URL - in production, upload to cloud storage
            const photoUrl = URL.createObjectURL(file);
            setProfile({ ...profile, photoUrl });
            toast.success("Photo uploaded! Click Save to update your profile.");
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload photo");
        } finally {
            setUploadingPhoto(false);
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
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={profile.photoUrl} />
                            <AvatarFallback className="text-2xl">
                                {profile.name?.charAt(0)?.toUpperCase() || profile.email?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <Label htmlFor="photo-upload" className="cursor-pointer">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                    <Upload className="h-4 w-4" />
                                    Upload a new photo (max 5MB)
                                </div>
                            </Label>
                            <Input
                                id="photo-upload"
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                disabled={uploadingPhoto}
                                className="max-w-xs"
                            />
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
                        <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <Label htmlFor="autoApply" className="text-base font-semibold text-blue-900 dark:text-blue-100">
                                        🚀 Enable Auto-Apply
                                    </Label>
                                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                                        Automatically apply to jobs that match your profile and resume (95-100% match).
                                        Save time and never miss an opportunity!
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="autoApply"
                                        checked={profile.autoApply}
                                        onChange={(e) => setProfile({ ...profile, autoApply: e.target.checked })}
                                        className="w-12 h-6 rounded-full appearance-none cursor-pointer bg-gray-300 checked:bg-blue-600 relative transition-colors
                                                   before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white
                                                   before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6"
                                    />
                                </div>
                            </div>
                            {profile.autoApply && (
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
