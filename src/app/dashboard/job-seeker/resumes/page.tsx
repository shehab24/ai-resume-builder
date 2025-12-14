"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Star, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Resume {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    isDefault: boolean;
}

export default function MyResumesPage() {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [settingDefault, setSettingDefault] = useState<string | null>(null);

    useEffect(() => {
        fetchResumes();
    }, []);

    const fetchResumes = async () => {
        try {
            const response = await fetch("/api/resumes");
            if (response.ok) {
                const data = await response.json();
                setResumes(data.resumes);
            }
        } catch (error) {
            console.error("Error fetching resumes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const setAsDefault = async (resumeId: string) => {
        setSettingDefault(resumeId);
        try {
            const response = await fetch(`/api/resume/${resumeId}/set-default`, {
                method: "POST",
            });

            if (!response.ok) throw new Error("Failed to set default resume");

            // Update local state
            setResumes(resumes.map(r => ({
                ...r,
                isDefault: r.id === resumeId
            })));

            toast.success("Default resume updated!");
        } catch (error) {
            console.error("Error setting default resume:", error);
            toast.error("Failed to set default resume");
        } finally {
            setSettingDefault(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">My Resumes</h1>
                    <p className="text-muted-foreground">View and manage your resumes</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/job-seeker/resume/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Resume
                    </Link>
                </Button>
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : resumes.length === 0 ? (
                <Card className="p-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No resumes yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first resume to get started</p>
                    <Button asChild>
                        <Link href="/dashboard/job-seeker/resume/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Resume
                        </Link>
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {resumes.map((resume) => (
                        <Card key={resume.id} className="hover:shadow-lg transition-shadow relative">
                            <Link href={`/dashboard/job-seeker/resume/${resume.id}`}>
                                <CardHeader>
                                    <div className="flex items-start gap-3">
                                        <FileText className="h-5 w-5 text-primary mt-1" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-lg">{resume.title}</CardTitle>
                                                {resume.isDefault && (
                                                    <Badge className="bg-green-500 hover:bg-green-600 gap-1">
                                                        <Star className="h-3 w-3 fill-current" />
                                                        Default
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Created: {new Date(resume.createdAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Updated: {new Date(resume.updatedAt).toLocaleDateString()}
                                    </p>
                                </CardContent>
                            </Link>

                            {!resume.isDefault && (
                                <div className="absolute bottom-4 right-4">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setAsDefault(resume.id);
                                        }}
                                        disabled={settingDefault === resume.id}
                                        className="gap-1.5"
                                    >
                                        {settingDefault === resume.id ? (
                                            <>Setting...</>
                                        ) : (
                                            <>
                                                <Star className="h-3.5 w-3.5" />
                                                Set as Default
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
