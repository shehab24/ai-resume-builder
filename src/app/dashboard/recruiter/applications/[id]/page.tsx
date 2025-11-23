"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, User, Calendar, FileText, Briefcase, GraduationCap, Award, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Resume {
    id: string;
    title: string;
    content: string; // JSON string
}

interface Application {
    id: string;
    status: string;
    createdAt: string;
    user: {
        name: string;
        email: string;
        resumes: Resume[];
    };
    job: {
        title: string;
        company: string;
    };
    taskSubmissions: string[];
}

export default function ApplicationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [application, setApplication] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchApplication = async () => {
            try {
                const response = await fetch(`/api/recruiter/applications/${params.id}`);
                if (!response.ok) throw new Error("Failed to fetch application");
                const data = await response.json();
                setApplication(data);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load application details");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchApplication();
        }
    }, [params.id]);

    const handleStatusChange = async (newStatus: string) => {
        setUpdating(true);
        try {
            const response = await fetch(`/api/recruiter/applications/${params.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error("Failed to update status");

            setApplication(prev => prev ? { ...prev, status: newStatus } : null);
            toast.success("Application status updated");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!application) {
        return <div>Application not found</div>;
    }

    const resume = application.user.resumes[0];
    let resumeData = null;
    if (resume) {
        try {
            resumeData = JSON.parse(resume.content);
        } catch (e) {
            console.error("Error parsing resume content", e);
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Candidates
            </Button>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Sidebar: Applicant Info & Status */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Applicant Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold">{application.user.name || "Anonymous"}</p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Mail className="h-3 w-3" /> {application.user.email}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <p className="text-sm font-medium mb-2">Applied for</p>
                                <p className="font-semibold">{application.job.title}</p>
                                <p className="text-sm text-muted-foreground">{application.job.company}</p>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(application.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="pt-4 border-t">
                                <p className="text-sm font-medium mb-2">Application Status</p>
                                <Select
                                    defaultValue={application.status}
                                    onValueChange={handleStatusChange}
                                    disabled={updating}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="REVIEWED">Reviewed</SelectItem>
                                        <SelectItem value="INTERVIEW">Interview</SelectItem>
                                        <SelectItem value="HIRED">Hired</SelectItem>
                                        <SelectItem value="REJECTED">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content: Resume & Tasks */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Resume
                            </CardTitle>
                            <CardDescription>
                                {resume ? resume.title : "No resume attached"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {resumeData ? (
                                <div className="space-y-6">
                                    {/* Summary */}
                                    {resumeData.summary && (
                                        <div>
                                            <h3 className="font-semibold mb-2 text-lg">Professional Summary</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {resumeData.summary}
                                            </p>
                                        </div>
                                    )}

                                    {/* Experience */}
                                    {resumeData.experience && resumeData.experience.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                                                <Briefcase className="h-4 w-4" /> Experience
                                            </h3>
                                            <div className="space-y-4">
                                                {resumeData.experience.map((exp: any, i: number) => (
                                                    <div key={i} className="border-l-2 border-primary/20 pl-4">
                                                        <h4 className="font-medium">{exp.role}</h4>
                                                        <p className="text-sm text-muted-foreground">{exp.company} | {exp.duration}</p>
                                                        <p className="text-sm mt-1">{exp.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Education */}
                                    {resumeData.education && resumeData.education.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                                                <GraduationCap className="h-4 w-4" /> Education
                                            </h3>
                                            <div className="space-y-4">
                                                {resumeData.education.map((edu: any, i: number) => (
                                                    <div key={i} className="border-l-2 border-primary/20 pl-4">
                                                        <h4 className="font-medium">{edu.degree}</h4>
                                                        <p className="text-sm text-muted-foreground">{edu.institution} | {edu.year}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Skills */}
                                    {resumeData.skills && resumeData.skills.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                                                <Award className="h-4 w-4" /> Skills
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {resumeData.skills.map((skill: string, i: number) => (
                                                    <Badge key={i} variant="secondary">{skill}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    No resume data available to display.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Task Submissions */}
                    {application.taskSubmissions && application.taskSubmissions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Task Submissions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside space-y-2">
                                    {application.taskSubmissions.map((submission, i) => (
                                        <li key={i} className="text-sm">{submission}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
