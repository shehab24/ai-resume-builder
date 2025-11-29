"use client";

import { useEffect, useState } from "react";
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

export default function AdminImportJobPage() {
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
            const activeSources = data.filter((s: any) => s.isActive);
            setSources(activeSources);

            // Auto-select source from URL if present
            const urlSourceId = searchParams.get("sourceId");
            if (urlSourceId) {
                setFormData(prev => ({ ...prev, sourceId: urlSourceId }));
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load job sources");
        } finally {
            setLoading(false);
        }
    };

    const handleAIParse = async () => {
        if (!importContent.trim()) {
            toast.error("Please paste a URL or Job Description first");
            return;
        }

        setAnalyzing(true);
        try {
            // Determine if it's a URL or Text
            const isUrl = importContent.startsWith("http");

            const res = await fetch("/api/admin/analyze-job", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: importContent,
                    type: isUrl ? 'url' : 'text'
                }),
            });

            if (!res.ok) throw new Error("Failed to analyze");

            const data = await res.json();

            // Auto-fill the form
            let detectedSourceId = formData.sourceId;

            // Try to auto-detect or create source from URL
            if (isUrl) {
                try {
                    const url = new URL(importContent);
                    const domain = url.hostname.replace('www.', '');

                    // Extract company name from domain (e.g., linkedin.com -> LinkedIn)
                    const companyName = domain.split('.')[0];
                    const sourceName = companyName.charAt(0).toUpperCase() + companyName.slice(1);

                    // Check if source already exists
                    let matchedSource = sources.find((s) =>
                        s.name.toLowerCase() === sourceName.toLowerCase() ||
                        s.name.toLowerCase().includes(companyName.toLowerCase())
                    );

                    // If not found, create a new source
                    if (!matchedSource) {
                        const createRes = await fetch("/api/admin/job-sources", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                name: sourceName,
                                url: `https://${domain}`,
                                isActive: true
                            }),
                        });

                        if (createRes.ok) {
                            const newSource = await createRes.json();
                            matchedSource = newSource;

                            // Add to sources array immediately
                            setSources(prev => [...prev, newSource]);

                            toast.success(`Created new job source: ${sourceName}`);
                        }
                    } else {
                        toast.info(`Auto-selected source: ${matchedSource.name}`);
                    }

                    if (matchedSource) {
                        detectedSourceId = matchedSource.id;
                    }
                } catch (urlError) {
                    console.error("Failed to parse URL:", urlError);
                }
            }

            setFormData(prev => ({
                ...prev,
                sourceId: detectedSourceId,
                title: data.title || prev.title,
                company: data.company || prev.company,
                location: data.location || prev.location,
                salary: data.salary || prev.salary,
                description: data.description || prev.description,
                requirements: data.requirements ? data.requirements.join("\n") : prev.requirements,
                jobType: data.jobType || "Full-time",
                workMode: data.workMode || "On-site",
                applicationEmail: data.applicationEmail || prev.applicationEmail,
                externalUrl: isUrl ? importContent : prev.externalUrl,
                applicationMethod: data.applicationEmail ? "EMAIL" : "EXTERNAL_LINK"
            }));

            toast.success("Job details auto-filled by AI! 🪄");
        } catch (error) {
            console.error(error);
            toast.error("Failed to analyze job. Try pasting the text directly.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Parse requirements
            const requirements = formData.requirements
                .split("\n")
                .filter((r) => r.trim())
                .map((r) => r.trim());

            const payload = {
                ...formData,
                requirements,
                isExternal: true,
            };

            const res = await fetch("/api/admin/import-job", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to import job");

            toast.success("Job imported successfully!");
            router.push("/dashboard/admin");
        } catch (error) {
            console.error(error);
            toast.error("Failed to import job");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Import External Job</h1>
                <p className="text-muted-foreground mt-1">
                    Use AI to auto-fill details from a URL or description
                </p>
            </div>

            {/* AI Smart Import Section */}
            <Card className="border-2 border-purple-100 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                        <Zap className="h-5 w-5" />
                        Smart Import
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Paste Job URL or Description Text</Label>
                        <Textarea
                            placeholder="Paste a LinkedIn link or the full job description here..."
                            value={importContent}
                            onChange={(e) => setImportContent(e.target.value)}
                            className="mt-2"
                            rows={3}
                        />
                    </div>
                    <Button
                        onClick={handleAIParse}
                        disabled={analyzing || !importContent}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        {analyzing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing with AI...
                            </>
                        ) : (
                            <>
                                <Zap className="mr-2 h-4 w-4" />
                                Auto-Fill Details
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Source Selection */}
                        <div>
                            <Label>Job Source *</Label>
                            <Select
                                value={formData.sourceId}
                                onValueChange={(value) => setFormData({ ...formData, sourceId: value })}
                                required
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
                                <Label>Job Title *</Label>
                                <Input
                                    placeholder="e.g., Senior Software Engineer"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Company *</Label>
                                <Input
                                    placeholder="e.g., Google"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Location</Label>
                                <Input
                                    placeholder="e.g., San Francisco, CA"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Salary</Label>
                                <Input
                                    placeholder="e.g., $120k - $180k"
                                    value={formData.salary}
                                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Job Type</Label>
                                <Select
                                    value={formData.jobType}
                                    onValueChange={(value) => setFormData({ ...formData, jobType: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Full-time">Full-time</SelectItem>
                                        <SelectItem value="Part-time">Part-time</SelectItem>
                                        <SelectItem value="Contract">Contract</SelectItem>
                                        <SelectItem value="Internship">Internship</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Work Mode</Label>
                                <Select
                                    value={formData.workMode}
                                    onValueChange={(value) => setFormData({ ...formData, workMode: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Remote">Remote</SelectItem>
                                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                                        <SelectItem value="On-site">On-site</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <Label>Job Description *</Label>
                            <Textarea
                                placeholder="Full job description..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={6}
                                required
                            />
                        </div>

                        {/* Requirements */}
                        <div>
                            <Label>Requirements (one per line) *</Label>
                            <Textarea
                                placeholder="Bachelor's degree in Computer Science&#10;5+ years of experience&#10;Proficient in React and Node.js"
                                value={formData.requirements}
                                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                rows={5}
                                required
                            />
                        </div>

                        {/* Application Method */}
                        <div>
                            <Label>Application Method *</Label>
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
                                <Label>External Application URL *</Label>
                                <Input
                                    type="url"
                                    placeholder="https://company.com/apply/job-id"
                                    value={formData.externalUrl}
                                    onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                                    required
                                />
                            </div>
                        )}

                        {formData.applicationMethod === "EMAIL" && (
                            <div>
                                <Label>Application Email *</Label>
                                <Input
                                    type="email"
                                    placeholder="jobs@company.com"
                                    value={formData.applicationEmail}
                                    onChange={(e) => setFormData({ ...formData, applicationEmail: e.target.value })}
                                    required
                                />
                            </div>
                        )}

                        {/* Submit */}
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Import Job
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
