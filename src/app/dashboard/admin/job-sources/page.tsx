"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, ExternalLink, Trash2, Globe, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface JobSource {
    id: string;
    name: string;
    url: string;
    description: string | null;
    isActive: boolean;
    scrapingEnabled: boolean;
    lastScrapedAt: string | null;
    createdAt: string;
    _count?: {
        jobs: number;
    };
}

export default function AdminJobSourcesPage() {
    const [sources, setSources] = useState<JobSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        url: "",
        description: "",
    });

    useEffect(() => {
        fetchSources();
    }, []);

    const fetchSources = async () => {
        try {
            const res = await fetch("/api/admin/job-sources");
            if (!res.ok) throw new Error("Failed to fetch sources");
            const data = await res.json();
            setSources(data);
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
            const res = await fetch("/api/admin/job-sources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to create source");

            toast.success("Job source added successfully!");
            setDialogOpen(false);
            setFormData({ name: "", url: "", description: "" });
            fetchSources();
        } catch (error) {
            console.error(error);
            toast.error("Failed to add job source");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/job-sources/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (!res.ok) throw new Error("Failed to update");

            toast.success(`Source ${!currentStatus ? "activated" : "deactivated"}`);
            fetchSources();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update source");
        }
    };

    const deleteSource = async (id: string) => {
        if (!confirm("Are you sure? This will not delete associated jobs.")) return;

        try {
            const res = await fetch(`/api/admin/job-sources/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Source deleted");
            fetchSources();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete source");
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">External Job Sources</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage external job boards and sources for job aggregation
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Source
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Job Source</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Source Name *</Label>
                                <Input
                                    placeholder="e.g., LinkedIn, Indeed, Company Careers"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Source URL *</Label>
                                <Input
                                    type="url"
                                    placeholder="https://example.com/jobs"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    placeholder="Brief description of this job source..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Add Source
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Sources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sources.map((source) => (
                    <Card key={source.id} className="hover:shadow-lg transition-all">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-lg">{source.name}</CardTitle>
                                </div>
                                {source.isActive ? (
                                    <Badge variant="default" className="bg-green-600">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Active
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Inactive
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    {source.url}
                                </a>
                            </div>

                            {source.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {source.description}
                                </p>
                            )}

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Jobs Imported:</span>
                                <Badge variant="outline">{source._count?.jobs || 0}</Badge>
                            </div>

                            {source.lastScrapedAt && (
                                <div className="text-xs text-muted-foreground">
                                    Last scraped: {new Date(source.lastScrapedAt).toLocaleDateString()}
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant={source.isActive ? "outline" : "default"}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => toggleActive(source.id, source.isActive)}
                                >
                                    {source.isActive ? "Deactivate" : "Activate"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => deleteSource(source.id)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {sources.length === 0 && (
                    <div className="col-span-full text-center py-12">
                        <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Job Sources Yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Add your first external job source to start aggregating jobs
                        </p>
                        <Button onClick={() => setDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add First Source
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
