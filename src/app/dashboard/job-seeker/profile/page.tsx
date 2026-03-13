"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CountrySelect } from "@/components/CountrySelect";
import { Loader2, Save, User as UserIcon, Camera, Award, FileText, Crown, ArrowLeft, Upload, MapPin, Mail, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/use-subscription";
import { useUser } from "@clerk/nextjs";

interface UserProfile {
    name: string;
    email: string;
    country: string;
    photoUrl?: string;
    autoApply: boolean;
    matchThreshold: number;
    autoApplyCountry: string;
    warningCount: number;
}

/* ─── Styles ─── */
const profileStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    .rl-profile-page {
        max-width: 780px;
        margin: 0 auto;
        padding: 0 24px 60px;
        font-family: 'Inter', sans-serif;
    }
    .rl-back-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #1e293b;
        font-size: 15px;
        font-weight: 500;
        text-decoration: none;
        padding: 12px 0 24px;
        transition: color 150ms;
        font-family: 'Inter', sans-serif;
    }
    .rl-back-link:hover {
        color: #003a9b;
    }
    .rl-profile-card {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 24px;
        padding: 32px;
        margin-bottom: 16px;
        font-family: 'Inter', sans-serif;
    }
    .rl-profile-header {
        display: flex;
        align-items: flex-start;
        gap: 24px;
    }
    .rl-profile-info {
        flex: 1;
    }
    .rl-profile-badge {
        display: inline-block;
        padding: 4px 14px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 16px;
    }
    .rl-badge-free {
        background: #dcfce7;
        color: #166534;
    }
    .rl-badge-pro {
        background: #dbeafe;
        color: #1e40af;
    }
    .rl-profile-avatar-lg {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid #e2e8f0;
        flex-shrink: 0;
    }
    .rl-profile-avatar-fallback {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: #f1f5f9;
        border: 3px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .rl-profile-avatar-fallback svg {
        width: 32px;
        height: 32px;
        color: #94a3b8;
    }
    .rl-info-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: #64748b;
        margin-bottom: 8px;
    }
    .rl-info-row svg {
        width: 16px;
        height: 16px;
        color: #94a3b8;
        flex-shrink: 0;
    }
    .rl-section-title {
        font-size: 22px;
        font-weight: 700;
        color: #111827;
        margin-bottom: 16px;
        font-family: 'Inter', sans-serif;
    }
    .rl-section-desc {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 20px;
        line-height: 1.5;
    }
    .rl-resume-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
    }
    .rl-resume-status {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #94a3b8;
        font-size: 14px;
    }
    .rl-resume-status svg {
        width: 24px;
        height: 24px;
    }
    .rl-btn-dark {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #111827;
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 150ms;
        text-decoration: none;
        font-family: 'Inter', sans-serif;
    }
    .rl-btn-dark:hover {
        background: #1f2937;
    }
    .rl-btn-danger {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #dc2626;
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 150ms;
        font-family: 'Inter', sans-serif;
    }
    .rl-btn-danger:hover {
        background: #b91c1c;
    }
    .rl-btn-save {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: #003a9b;
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 14px 32px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: background 150ms;
        width: 100%;
        font-family: 'Inter', sans-serif;
    }
    .rl-btn-save:hover {
        background: #002d7a;
    }
    .rl-btn-save:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    .rl-credits-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
    }
    .rl-credits-label {
        font-size: 15px;
        font-weight: 600;
        color: #111827;
    }
    .rl-credits-value {
        font-size: 15px;
        color: #64748b;
    }
    .rl-usage-actions {
        display: flex;
        align-items: center;
        gap: 16px;
    }
    .rl-view-link {
        font-size: 14px;
        color: #003a9b;
        text-decoration: underline;
        font-weight: 500;
        cursor: pointer;
    }
    .rl-danger-card {
        background: #fff;
        border: 1px solid #fecaca;
        border-radius: 24px;
        padding: 32px;
        margin-bottom: 16px;
    }
    .rl-danger-title {
        font-size: 22px;
        font-weight: 700;
        color: #dc2626;
        margin-bottom: 8px;
        font-family: 'Inter', sans-serif;
    }
    .rl-danger-desc {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 20px;
        line-height: 1.5;
    }
    .rl-form-group {
        margin-bottom: 20px;
    }
    .rl-form-label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 6px;
        font-family: 'Inter', sans-serif;
    }
    .rl-form-input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        font-size: 14px;
        color: #111827;
        background: #fff;
        outline: none;
        transition: border 150ms;
        font-family: 'Inter', sans-serif;
    }
    .rl-form-input:focus {
        border-color: #003a9b;
    }
    .rl-form-input:disabled {
        background: #f9fafb;
        color: #9ca3af;
    }
    .rl-form-hint {
        font-size: 12px;
        color: #9ca3af;
        margin-top: 4px;
    }
    .rl-auto-apply-card {
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 24px;
    }
    .rl-auto-apply-card.free {
        background: #fffbeb;
        border: 1px solid #fde68a;
    }
    .rl-auto-apply-card.pro {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
    }
    .rl-toggle-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
    }
    .rl-toggle-label {
        font-size: 15px;
        font-weight: 600;
        color: #111827;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .rl-toggle-desc {
        font-size: 13px;
        color: #6b7280;
        margin-top: 4px;
        line-height: 1.5;
    }
    .rl-toggle-switch {
        width: 48px;
        height: 26px;
        border-radius: 999px;
        appearance: none;
        cursor: pointer;
        position: relative;
        transition: background-color 200ms;
        background: #d1d5db;
        flex-shrink: 0;
        border: none;
        outline: none;
    }
    .rl-toggle-switch::before {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #fff;
        top: 3px;
        left: 3px;
        transition: transform 200ms;
    }
    .rl-toggle-switch:checked {
        background: #003a9b;
    }
    .rl-toggle-switch:checked::before {
        transform: translateX(22px);
    }
    .rl-toggle-switch:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .rl-upgrade-banner {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid rgba(0,0,0,0.08);
    }
    .rl-btn-upgrade {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: #f59e0b;
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 150ms;
        width: 100%;
        font-family: 'Inter', sans-serif;
    }
    .rl-btn-upgrade:hover {
        background: #d97706;
    }
    .rl-warning-card {
        background: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: 24px;
        padding: 24px 32px;
        margin-bottom: 16px;
        display: flex;
        align-items: flex-start;
        gap: 14px;
    }
    .rl-warning-icon {
        background: #fef3c7;
        border-radius: 50%;
        padding: 8px;
        flex-shrink: 0;
    }
    .rl-warning-title {
        font-size: 16px;
        font-weight: 700;
        color: #78350f;
        margin-bottom: 4px;
    }
    .rl-warning-text {
        font-size: 13px;
        color: #92400e;
        line-height: 1.5;
    }
`;

export default function ProfilePage() {
    const router = useRouter();
    const { user: clerkUser } = useUser();
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
                if (data.resumes && data.resumes.length > 0) {
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

        if (profile.autoApply && !isPro) {
            toast.error("Auto-Apply is a Pro feature! Upgrade to enable it.");
            setProfile({ ...profile, autoApply: false });
            return;
        }

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
            setProfile({ ...profile, ...updatedData });

            setTimeout(() => {
                router.push("/dashboard/job-seeker");
            }, 1000);
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const avatarUrl = profile.photoUrl || clerkUser?.imageUrl;

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <Loader2 style={{ width: 32, height: 32, animation: "spin 1s linear infinite" }} />
            </div>
        );
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: profileStyles }} />
            <div className="rl-profile-page">

                {/* Back Link */}
                <Link href="/dashboard/job-seeker" className="rl-back-link">
                    <ArrowLeft size={18} />
                    Back
                </Link>

                {/* Warning Banner */}
                {profile.warningCount > 0 && (
                    <div className="rl-warning-card">
                        <div className="rl-warning-icon">
                            <AlertTriangle size={20} color="#ca8a04" />
                        </div>
                        <div>
                            <div className="rl-warning-title">
                                ⚠️ Account Warning
                            </div>
                            <div className="rl-warning-text">
                                You have received <strong>{profile.warningCount}</strong> warning{profile.warningCount > 1 ? 's' : ''} for violating our community guidelines.
                                Please review our terms of service and ensure compliance to avoid account suspension.
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Info Card */}
                <div className="rl-profile-card">
                    <div className="rl-profile-header">
                        <div className="rl-profile-info">
                            <span className={`rl-profile-badge ${isPro ? 'rl-badge-pro' : 'rl-badge-free'}`}>
                                {isPro ? 'Pro' : 'Free'}
                            </span>
                            <div className="rl-info-row">
                                <Mail size={16} />
                                <span>{profile.email || "No email set"}</span>
                            </div>
                            <div className="rl-info-row">
                                <MapPin size={16} />
                                <span>{profile.country || "N/A"}</span>
                            </div>
                        </div>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile" className="rl-profile-avatar-lg" />
                        ) : (
                            <div className="rl-profile-avatar-fallback">
                                <UserIcon />
                            </div>
                        )}
                    </div>
                </div>

                {/* Base Resume Card */}
                <div className="rl-profile-card">
                    <h2 className="rl-section-title">Base Resume</h2>
                    <div className="rl-resume-row">
                        <div className="rl-resume-status">
                            <FileText size={24} />
                            <span>{resumeCount > 0 ? `${resumeCount} Resume${resumeCount > 1 ? 's' : ''} Available` : "Not Available"}</span>
                        </div>
                        <Link href="/dashboard/job-seeker/resume/create" className="rl-btn-dark">
                            <Upload size={16} />
                            Upload Resume
                        </Link>
                    </div>
                </div>

                {/* Usage Card */}
                <div className="rl-profile-card">
                    <h2 className="rl-section-title">Usage</h2>
                    <p className="rl-section-desc">
                        Track your usage and unlock more credits when you&apos;re ready to do more
                    </p>
                    <div className="rl-credits-row">
                        <span className="rl-credits-label">Credits</span>
                        <span className="rl-credits-value">{isPro ? "Unlimited" : "0 / 100"}</span>
                    </div>
                    <div className="rl-usage-actions">
                        {!isPro && (
                            <button
                                className="rl-btn-dark"
                                onClick={() => subscribe('PRO', 299)}
                                disabled={subscribing}
                            >
                                <Crown size={14} />
                                {subscribing ? 'Processing...' : 'Upgrade Now'}
                            </button>
                        )}
                        <span className="rl-view-link">View Usage</span>
                    </div>
                </div>

                {/* Personal Information Card */}
                <div className="rl-profile-card">
                    <h2 className="rl-section-title">Personal Information</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="rl-form-group">
                            <label className="rl-form-label">Full Name</label>
                            <input
                                className="rl-form-input"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="rl-form-group">
                            <label className="rl-form-label">Email</label>
                            <input
                                className="rl-form-input"
                                type="email"
                                value={profile.email}
                                disabled
                            />
                            <p className="rl-form-hint">Email cannot be changed</p>
                        </div>

                        <div className="rl-form-group">
                            <label className="rl-form-label">
                                Country <span style={{ color: "#dc2626" }}>*</span>
                            </label>
                            <CountrySelect
                                value={profile.country}
                                onValueChange={(value) => setProfile({ ...profile, country: value })}
                                placeholder="Select your country"
                            />
                            {!profile.country && (
                                <p style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>
                                    Country is required to complete your profile
                                </p>
                            )}
                        </div>

                        <div className="rl-form-group">
                            <label className="rl-form-label">Profile Photo URL</label>
                            <input
                                className="rl-form-input"
                                type="url"
                                placeholder="https://example.com/your-photo.jpg"
                                value={profile.photoUrl || ""}
                                onChange={(e) => setProfile({ ...profile, photoUrl: e.target.value })}
                            />
                            <p className="rl-form-hint">
                                Paste a URL to an image (e.g., from Imgur, your website, or any public image URL)
                            </p>
                        </div>

                        {/* Auto-Apply Toggle */}
                        <div className={`rl-auto-apply-card ${isPro ? 'pro' : 'free'}`}>
                            <div className="rl-toggle-row">
                                <div style={{ flex: 1 }}>
                                    <div className="rl-toggle-label">
                                        {isPro ? '🚀' : <Crown size={16} color="#f59e0b" />}
                                        Enable Auto-Apply
                                        {!isPro && (
                                            <span style={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                background: "#fde68a",
                                                color: "#92400e",
                                                padding: "2px 8px",
                                                borderRadius: 999
                                            }}>PRO</span>
                                        )}
                                    </div>
                                    <p className="rl-toggle-desc">
                                        {isPro
                                            ? "Automatically apply to jobs that match your profile and resume. Save time and never miss an opportunity!"
                                            : "Upgrade to Pro to automatically apply to hundreds of matching jobs!"}
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    className="rl-toggle-switch"
                                    checked={profile.autoApply}
                                    disabled={!isPro}
                                    onChange={(e) => setProfile({ ...profile, autoApply: e.target.checked })}
                                />
                            </div>
                            {!isPro && (
                                <div className="rl-upgrade-banner">
                                    <button
                                        type="button"
                                        className="rl-btn-upgrade"
                                        onClick={() => subscribe('PRO', 299)}
                                        disabled={subscribing}
                                    >
                                        <Crown size={14} />
                                        {subscribing ? 'Processing...' : 'Upgrade to Pro - ৳299/month'}
                                    </button>
                                </div>
                            )}
                            {isPro && profile.autoApply && (
                                <div style={{
                                    marginTop: 16,
                                    fontSize: 12,
                                    color: "#1e40af",
                                    background: "#dbeafe",
                                    padding: "10px 14px",
                                    borderRadius: 10,
                                }}>
                                    ✓ Auto-apply is enabled. We'll apply to matching jobs on your behalf using your default resume.
                                </div>
                            )}
                        </div>

                        <button type="submit" className="rl-btn-save" disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Danger Zone */}
                <div className="rl-danger-card">
                    <h2 className="rl-danger-title">Danger Zone</h2>
                    <p className="rl-danger-desc">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button className="rl-btn-danger">
                        <Trash2 size={14} />
                        Delete Account
                    </button>
                </div>
            </div>
        </>
    );
}
