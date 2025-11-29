"use client";

import { Suspense, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, ExternalLink, Zap } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

interface JobSource {
    id: string;
    name: string;
}

function AdminImportJobContent() {
    const router = useRouter();
    const [sources, setSources] = useState<JobSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        sourceId: "",
        title: "",
        company: "",
        location: "",
        description: "",
        requirements: "",
        externalUrl: "",
        applicationMethod: "EXTERNAL_LINK",
        applicationEmail: "",
        salary: "",
        jobType: "",
        workMode: "",
    });

    const [analyzing, setAnalyzing] = useState(false);
    const [importContent, setImportContent] = useState("");

    const searchParams = useSearchParams();

    useEffect(() => {
        fetchSources();
    }, []);

    const fetchSources = async () => {
        try {
            const res = await fetch("/api/admin/job-sources");
            if (!res.ok) throw new Error("Failed to fetch sources");
            const data = await res.json();
            setSources(data.sources || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load job sources");
        } finally {
            setLoading(false);
        }
    };

    const analyzeJobPosting = async () => {
        if (!importContent.trim()) {
            toast.error("Please paste job posting content");
            return;
        }

        setAnalyzing(true);
        try {
            const res = await fetch("/api/admin/analyze-job", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: importContent }),
            });

            if (!res.ok) throw new Error("Failed to analyze job posting");

            const data = await res.json();

            // Pre-fill form with analyzed data
            setFormData(prev => ({
                ...prev,
                title: data.title || prev.title,
                company: data.company || prev.company,
                location: data.location || prev.location,
                description: data.description || prev.description,
                requirements: data.requirements || prev.requirements,
                salary: data.salary || prev.salary,
                jobType: data.jobType || prev.jobType,
                workMode: data.workMode || prev.workMode,
            }));

            toast.success("Job posting analyzed successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to analyze job posting");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.sourceId || !formData.title || !formData.company) {
            toast.error("Please fill in all required fields");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/admin/import-job", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to import job");

            const data = await res.json();
            toast.success("Job imported successfully!");
            router.push("/dashboard/admin/imported-jobs");
        } catch (error) {
            console.error(error);
            toast.error("Failed to import job");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Import External Job</h1>
                <p className="text-muted-foreground mt-2">
                    Import job postings from external sources to your platform
                </p>
            </div>

            {/* AI Analysis Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        AI-Powered Job Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="import-content">Paste Job Posting Content</Label>
                        <Textarea
                            id="import-content"
                            placeholder="Paste the full job posting content here (from LinkedIn, Indeed, etc.)..."
                            value={importContent}
                            onChange={(e) => setImportContent(e.target.value)}
                            rows={8}
                            className="font-mono text-sm"
                        />
                    </div>
                    <Button
                        onClick={analyzeJobPosting}
                        disabled={analyzing || !importContent.trim()}
                        className="w-full"
                    >
                        {analyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Zap className="mr-2 h-4 w-4" />
                        Analyze with AI
                    </Button>
                </CardContent>
            </Card>

            {/* Manual Import Form */}
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Job Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Source Selection */}
                        <div>
                            <Label htmlFor="source">Job Source *</Label>
                            <Select
                                value={formData.sourceId}
                                onValueChange={(value) => setFormData({ ...formData, sourceId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a source" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sources.map((source) => (
                                        <SelectItem key={source.id} value={source.id}>
                                            {source.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="title">Job Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Senior Software Engineer"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="company">Company *</Label>
                                <Input
                                    id="company"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    placeholder="e.g. Google"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g. San Francisco, CA"
                                />
                            </div>
                            <div>
                                <Label htmlFor="salary">Salary Range</Label>
                                <Input
                                    id="salary"
                                    value={formData.salary}
                                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                    placeholder="e.g. $120k - $180k"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="jobType">Job Type</Label>
                                <Select
                                    value={formData.jobType}
                                    onValueChange={(value) => setFormData({ ...formData, jobType: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select job type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FULL_TIME">Full Time</SelectItem>
                                        <SelectItem value="PART_TIME">Part Time</SelectItem>
                                        <SelectItem value="CONTRACT">Contract</SelectItem>
                                        <SelectItem value="INTERNSHIP">Internship</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="workMode">Work Mode</Label>
                                <Select
                                    value={formData.workMode}
                                    onValueChange={(value) => setFormData({ ...formData, workMode: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select work mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="REMOTE">Remote</SelectItem>
                                        <SelectItem value="HYBRID">Hybrid</SelectItem>
                                        <SelectItem value="ONSITE">On-site</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <Label htmlFor="description">Job Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Detailed job description..."
                                rows={6}
                            />
                        </div>

                        {/* Requirements */}
                        <div>
                            <Label htmlFor="requirements">Requirements</Label>
                            <Textarea
                                id="requirements"
                                value={formData.requirements}
                                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                placeholder="Job requirements (one per line)..."
                                rows={6}
                            />
                        </div>

                        {/* Application Method */}
                        <div>
                            <Label htmlFor="applicationMethod">Application Method</Label>
                            <Select
                                value={formData.applicationMethod}
                                onValueChange={(value) => setFormData({ ...formData, applicationMethod: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EXTERNAL_LINK">External Link</SelectItem>
                                    <SelectItem value="EMAIL">Email</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.applicationMethod === "EXTERNAL_LINK" && (
                            <div>
                                <Label htmlFor="externalUrl">Application URL</Label>
                                <Input
                                    id="externalUrl"
                                    type="url"
                                    value={formData.externalUrl}
                                    onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                                    placeholder="https://company.com/careers/apply"
                                />
                            </div>
                        )}

                        {formData.applicationMethod === "EMAIL" && (
                            <div>
                                <Label htmlFor="applicationEmail">Application Email</Label>
                                <Input
                                    id="applicationEmail"
                                    type="email"
                                    value={formData.applicationEmail}
                                    onChange={(e) => setFormData({ ...formData, applicationEmail: e.target.value })}
                                    placeholder="careers@company.com"
                                />
                            </div>
                        )}

                        <div className="flex gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting} className="flex-1">
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Plus className="mr-2 h-4 w-4" />
                                Import Job
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}

export default function AdminImportJobPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <AdminImportJobContent />
        </Suspense>
    );
}
