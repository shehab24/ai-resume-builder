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

export default function AdminEditJobPage() {
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
        jobType: "FULL_TIME",
        workMode: "ON_SITE",
        experienceLevel: "MID",
        salaryMin: "",
        salaryMax: "",
        requirements: "",
        benefits: "",
        applicationDeadline: "",
        tasks: "",
        isExternal: false,
        externalUrl: "",
        applicationMethod: "INTERNAL",
        applicationEmail: "",
    });

    useEffect(() => {
        const fetchJob = async () => {
            try {
                // We can reuse the public job fetch endpoint since it returns all details
                // Or use a specific admin endpoint if we want to see hidden fields
                const res = await fetch(`/api/jobs/${params.id}`);
                if (!res.ok) throw new Error("Failed to fetch job");
                const job = await res.json();

                setFormData({
                    title: job.title || "",
                    company: job.company || "",
                    description: job.description || "",
                    location: job.location || "",
                    country: job.country || "",
                    jobType: job.jobType || "FULL_TIME",
                    workMode: job.workMode || "ON_SITE",
                    experienceLevel: job.experienceLevel || "MID",
                    salaryMin: job.salaryMin?.toString() || "",
                    salaryMax: job.salaryMax?.toString() || "",
                    requirements: job.requirements?.join(", ") || "",
                    benefits: job.benefits?.join(", ") || "",
                    applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : "",
                    tasks: job.tasks?.join(", ") || "",
                    isExternal: !!job.isExternal,
                    externalUrl: job.externalUrl || "",
                    applicationMethod: job.applicationMethod || "INTERNAL",
                    applicationEmail: job.applicationEmail || "",
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
            const response = await fetch(`/api/admin/jobs/${params.id}`, {
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
            router.push("/dashboard/admin/jobs");
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
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="text-red-600">Admin Edit: Job Posting</CardTitle>
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
                                        <SelectItem value="FULL_TIME">Full Time</SelectItem>
                                        <SelectItem value="PART_TIME">Part Time</SelectItem>
                                        <SelectItem value="CONTRACT">Contract</SelectItem>
                                        <SelectItem value="INTERNSHIP">Internship</SelectItem>
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
                                        <SelectItem value="ON_SITE">On-site</SelectItem>
                                        <SelectItem value="REMOTE">Remote</SelectItem>
                                        <SelectItem value="HYBRID">Hybrid</SelectItem>
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
                                        <SelectItem value="ENTRY">Entry</SelectItem>
                                        <SelectItem value="MID">Mid</SelectItem>
                                        <SelectItem value="SENIOR">Senior</SelectItem>
                                        <SelectItem value="LEAD">Lead</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g., San Francisco, CA"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    placeholder="e.g., United States"
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="salaryMin">Minimum Salary</Label>
                                <Input
                                    id="salaryMin"
                                    type="number"
                                    value={formData.salaryMin}
                                    onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                                    placeholder="50000"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="salaryMax">Maximum Salary</Label>
                                <Input
                                    id="salaryMax"
                                    type="number"
                                    value={formData.salaryMax}
                                    onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                                    placeholder="100000"
                                />
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

                        {/* ── Application & Extension Settings ── */}
                        <div className="border-t pt-6 space-y-4">
                            <h3 className="font-semibold text-lg text-slate-800">Application &amp; Auto-Apply Settings</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="applicationMethod">Application Method</Label>
                                    <Select 
                                        value={formData.applicationMethod} 
                                        onValueChange={(value) => setFormData({ 
                                            ...formData, 
                                            applicationMethod: value,
                                            // Auto-tick isExternal if external link is chosen
                                            isExternal: value === "EXTERNAL_LINK" ? true : formData.isExternal
                                        })}
                                    >
                                        <SelectTrigger id="applicationMethod">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INTERNAL">Internal TalentFlow Apply</SelectItem>
                                            <SelectItem value="EXTERNAL_LINK">External Apply URL</SelectItem>
                                            <SelectItem value="EMAIL">Email Application</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center space-x-2 pt-8">
                                    <input
                                        type="checkbox"
                                        id="isExternal"
                                        checked={formData.isExternal}
                                        onChange={(e) => setFormData({ ...formData, isExternal: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                    />
                                    <Label htmlFor="isExternal" className="cursor-pointer font-medium">
                                        Is External Job (Requires Chrome Extension Auto-Apply)
                                    </Label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="externalUrl">
                                    Job URL / External Application Link 
                                    {(formData.applicationMethod === "EXTERNAL_LINK" || formData.isExternal) ? " *" : " (Optional)"}
                                </Label>
                                <Input
                                    id="externalUrl"
                                    value={formData.externalUrl}
                                    onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                                    placeholder="https://example.com/careers/apply"
                                    required={formData.applicationMethod === "EXTERNAL_LINK" || formData.isExternal}
                                />
                            </div>

                            {formData.applicationMethod === "EMAIL" && (
                                <div className="space-y-2">
                                    <Label htmlFor="applicationEmail">Application Email Address *</Label>
                                    <Input
                                        id="applicationEmail"
                                        type="email"
                                        value={formData.applicationEmail}
                                        onChange={(e) => setFormData({ ...formData, applicationEmail: e.target.value })}
                                        placeholder="jobs@company.com"
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit" disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700">
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes (Admin)
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
