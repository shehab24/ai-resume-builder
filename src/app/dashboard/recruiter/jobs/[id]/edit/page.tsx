"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CountrySelect } from "@/components/CountrySelect";
import { CURRENCIES } from "@/lib/currencies";

export default function EditJobPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        company: "",
        description: "",
        location: "",
        country: "",
        jobType: "Full-time",
        workMode: "On-site",
        experienceLevel: "Mid",
        salaryMin: "",
        salaryMax: "",
        salaryCurrency: "BDT",
        requirements: "",
        benefits: "",
        applicationDeadline: "",
        tasks: "",
    });

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await fetch(`/api/jobs/${params.id}`);
                if (!res.ok) throw new Error("Failed to fetch job");
                const job = await res.json();

                console.log("Edit Page - Received job data:", job);

                setFormData({
                    title: job.title || "",
                    company: job.company || "",
                    description: job.description || "",
                    location: job.location || "",
                    country: job.country || "",
                    jobType: job.jobType || "Full-time",
                    workMode: job.workMode || "On-site",
                    experienceLevel: job.experienceLevel || "Mid",
                    salaryMin: job.salaryMin?.toString() || "",
                    salaryMax: job.salaryMax?.toString() || "",
                    salaryCurrency: job.salaryCurrency || "BDT",
                    requirements: job.requirements?.join(", ") || "",
                    benefits: job.benefits?.join(", ") || "",
                    applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : "",
                    tasks: job.tasks?.join(", ") || "",
                });

                console.log("Edit Page - Set formData:", {
                    jobType: job.jobType,
                    workMode: job.workMode,
                    experienceLevel: job.experienceLevel
                });
            } catch (error) {
                console.error(error);
                toast.error("Failed to load job details");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchJob();
        }
    }, [params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch(`/api/recruiter/jobs/${params.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
                    salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
                    requirements: formData.requirements.split(",").map(r => r.trim()).filter(Boolean),
                    benefits: formData.benefits.split(",").map(b => b.trim()).filter(Boolean),
                    tasks: formData.tasks.split(",").map(t => t.trim()).filter(Boolean),
                }),
            });

            if (!response.ok) throw new Error("Failed to update job");

            toast.success("Job updated successfully!");
            router.push("/dashboard/recruiter/jobs");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update job");
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
            <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Edit Job Posting</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Job Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="company">Company *</Label>
                                <Input
                                    id="company"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={5}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="jobType">Job Type</Label>
                                <Select value={formData.jobType} onValueChange={(value) => setFormData({ ...formData, jobType: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Full-time">Full-time</SelectItem>
                                        <SelectItem value="Part-time">Part-time</SelectItem>
                                        <SelectItem value="Contract">Contract</SelectItem>
                                        <SelectItem value="Internship">Internship</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="workMode">Work Mode</Label>
                                <Select value={formData.workMode} onValueChange={(value) => setFormData({ ...formData, workMode: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="On-site">On-site</SelectItem>
                                        <SelectItem value="Remote">Remote</SelectItem>
                                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="experienceLevel">Experience Level</Label>
                                <Select value={formData.experienceLevel} onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Entry">Entry Level</SelectItem>
                                        <SelectItem value="Mid">Mid Level</SelectItem>
                                        <SelectItem value="Senior">Senior</SelectItem>
                                        <SelectItem value="Lead">Lead/Principal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <CountrySelect
                                    value={formData.country}
                                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                                    placeholder="Select country..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">City / State</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g., San Francisco, CA"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="applicationDeadline">Application Deadline</Label>
                                <Input
                                    id="applicationDeadline"
                                    type="date"
                                    value={formData.applicationDeadline}
                                    onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="salaryCurrency">Salary Currency</Label>
                                <Select value={formData.salaryCurrency} onValueChange={(value) => setFormData({ ...formData, salaryCurrency: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CURRENCIES.map((currency) => (
                                            <SelectItem key={currency.code} value={currency.code}>
                                                {currency.symbol} {currency.code} - {currency.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="salaryMin">Minimum Salary ({formData.salaryCurrency})</Label>
                                    <Input
                                        id="salaryMin"
                                        type="number"
                                        value={formData.salaryMin}
                                        onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                                        placeholder="50000"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="salaryMax">Maximum Salary ({formData.salaryCurrency})</Label>
                                    <Input
                                        id="salaryMax"
                                        type="number"
                                        value={formData.salaryMax}
                                        onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                                        placeholder="100000"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="requirements">Requirements (comma-separated)</Label>
                            <Textarea
                                id="requirements"
                                value={formData.requirements}
                                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                placeholder="React, Node.js, TypeScript"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="benefits">Benefits (comma-separated)</Label>
                            <Textarea
                                id="benefits"
                                value={formData.benefits}
                                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                                placeholder="Health Insurance, 401k, Remote Work"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tasks">Application Tasks (comma-separated)</Label>
                            <Textarea
                                id="tasks"
                                value={formData.tasks}
                                onChange={(e) => setFormData({ ...formData, tasks: e.target.value })}
                                placeholder="Complete coding challenge, Submit portfolio"
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit" disabled={saving} className="flex-1">
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
