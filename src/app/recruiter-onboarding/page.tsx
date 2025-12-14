"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Building, Globe, Users, Mail, CheckCircle2, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";

export default function RecruiterOnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState("NONE");
    const [sendingOTP, setSendingOTP] = useState(false);
    const [verifyingOTP, setVerifyingOTP] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [showOTPInput, setShowOTPInput] = useState(false);

    const [formData, setFormData] = useState({
        companyName: "",
        companyEmail: "",
        website: "",
        size: "",
        description: ""
    });
    const [otp, setOtp] = useState("");

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
                const data = await res.json();
                setStatus(data.recruiterStatus || "NONE");
            }
        } catch (error) {
            console.error("Error checking status:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async () => {
        if (!formData.companyEmail) {
            toast.error("Please enter company email");
            return;
        }

        setSendingOTP(true);
        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.companyEmail })
            });

            if (res.ok) {
                setShowOTPInput(true);
                toast.success("Verification code sent!");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to send code");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setSendingOTP(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            toast.error("Please enter the 6-digit code");
            return;
        }

        setVerifyingOTP(true);
        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.companyEmail,
                    token: otp
                })
            });

            if (res.ok) {
                setEmailVerified(true);
                setShowOTPInput(false);
                toast.success("Email verified!");
            } else {
                const data = await res.json();
                toast.error(data.error || "Invalid code");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setVerifyingOTP(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch("/api/recruiter/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    emailVerified
                })
            });

            if (res.ok) {
                toast.success("Application submitted successfully!");
                setTimeout(() => {
                    router.push("/dashboard/job-seeker");
                }, 1500);
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to submit");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        );
    }

    if (status === "PENDING") {
        return (
            <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <Info className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Application Submitted</h2>
                        <p className="text-sm text-gray-600 mb-6">
                            Your recruiter application is under review. You'll be notified once approved.
                        </p>
                        <Button variant="outline" onClick={() => router.push("/dashboard/job-seeker")} className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status === "REJECTED") {
        return (
            <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <Info className="h-6 w-6 text-red-600" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Application Not Approved</h2>
                        <p className="text-sm text-gray-600 mb-6">
                            Your application was not approved. Contact support for more information.
                        </p>
                        <Button variant="outline" onClick={() => router.push("/dashboard/job-seeker")} className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status === "APPROVED") {
        router.push("/dashboard/recruiter");
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <Link href="/dashboard/job-seeker" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Apply as Recruiter</h1>
                    <p className="text-gray-600 mt-2">Fill in your company details to get started</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Company Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Company Name */}
                            <div className="space-y-2">
                                <Label htmlFor="companyName">
                                    Company Name <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="companyName"
                                        placeholder="Acme Corporation"
                                        className="pl-10"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Company Email */}
                            <div className="space-y-2">
                                <Label htmlFor="companyEmail">
                                    Company Email <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <Input
                                            id="companyEmail"
                                            type="email"
                                            placeholder="contact@company.com"
                                            className="pl-10"
                                            value={formData.companyEmail}
                                            onChange={(e) => {
                                                setFormData({ ...formData, companyEmail: e.target.value });
                                                setEmailVerified(false);
                                                setShowOTPInput(false);
                                            }}
                                            required
                                            disabled={emailVerified}
                                        />
                                        {emailVerified && (
                                            <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-green-600" />
                                        )}
                                    </div>
                                    {!emailVerified && (
                                        <Button
                                            type="button"
                                            onClick={handleSendOTP}
                                            disabled={sendingOTP || !formData.companyEmail}
                                            variant="outline"
                                        >
                                            {sendingOTP ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                                        </Button>
                                    )}
                                </div>

                                {showOTPInput && !emailVerified && (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter 6-digit code"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            maxLength={6}
                                        />
                                        <Button
                                            type="button"
                                            onClick={handleVerifyOTP}
                                            disabled={verifyingOTP || otp.length !== 6}
                                            variant="outline"
                                        >
                                            {verifyingOTP ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                                        </Button>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500">
                                    {emailVerified ? "✓ Email verified" : "Optional: Verify to increase approval chances"}
                                </p>
                            </div>

                            {/* Website */}
                            <div className="space-y-2">
                                <Label htmlFor="website">
                                    Company Website <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="website"
                                        type="url"
                                        placeholder="https://company.com"
                                        className="pl-10"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Company Size */}
                            <div className="space-y-2">
                                <Label htmlFor="size">Company Size</Label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="size"
                                        placeholder="e.g., 10-50 employees"
                                        className="pl-10"
                                        value={formData.size}
                                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">About Your Company</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Brief description of your company..."
                                    className="min-h-[100px] resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-900">
                                <p className="font-medium mb-1">What happens next?</p>
                                <p className="text-blue-700">
                                    Our team will review your application within 1-2 business days.
                                    You can continue using the platform as a job seeker while waiting.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push("/dashboard/job-seeker")}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Application
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
