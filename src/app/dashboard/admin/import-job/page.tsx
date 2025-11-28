"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

    useEffect(() => {
        fetchSources();
    }, []);

    const fetchSources = async () => {
        try {
            const res = await fetch("/api/admin/job-sources");
            if (!res.ok) throw new Error("Failed to fetch sources");
            const data = await res.json();
            setSources(data.filter((s: any) => s.isActive));
        } catch (error) {
            console.error(error);
            toast.error("Failed to load job sources");
        } finally {
            setLoading(false);
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
                    Manually add a job from an external source
                </p>
            </div>

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
