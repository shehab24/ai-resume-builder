"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles, FileText, Clock, Trash2, Star } from "lucide-react";
import Link from "next/link";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const TEMPLATES = [
    {
        id: "modern",
        name: "Modern Professional",
        description: "Clean and minimalist design perfect for tech and corporate roles.",
        color: "from-blue-500 to-cyan-500"
    },
    {
        id: "creative",
        name: "Creative Bold",
        description: "Stand out with a unique layout ideal for creative industries.",
        color: "from-purple-500 to-pink-500"
    },
    {
        id: "executive",
        name: "Executive Classic",
        description: "Traditional and elegant design for senior positions.",
        color: "from-gray-700 to-gray-900"
    },
];

interface Resume {
    id: string;
    title: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function CreateResumePage() {
    const [selectedTemplate, setSelectedTemplate] = useState("modern");
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [allResumes, setAllResumes] = useState<Resume[]>([]);
    const [loadingResumes, setLoadingResumes] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [settingDefault, setSettingDefault] = useState<string | null>(null);

    useEffect(() => {
        fetchAllResumes();

        // Load saved draft
        const savedPrompt = localStorage.getItem("resume_prompt_draft");
        const savedTemplate = localStorage.getItem("resume_template_draft");

        if (savedPrompt) setPrompt(savedPrompt);
        if (savedTemplate) setSelectedTemplate(savedTemplate);
    }, []);

    // Save draft on change
    useEffect(() => {
        localStorage.setItem("resume_prompt_draft", prompt);
    }, [prompt]);

    useEffect(() => {
        localStorage.setItem("resume_template_draft", selectedTemplate);
    }, [selectedTemplate]);

    const fetchAllResumes = async () => {
        try {
            const response = await fetch("/api/resumes");
            if (response.ok) {
                const data = await response.json();
                setAllResumes(data.resumes);
            }
        } catch (error) {
            console.error("Error fetching resumes:", error);
        } finally {
            setLoadingResumes(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter your details to generate a resume.");
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch("/api/resume/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, templateId: selectedTemplate }),
            });

            if (!response.ok) throw new Error("Failed to generate resume");

            const data = await response.json();
            toast.success("Resume generated successfully!");

            // Clear draft
            localStorage.removeItem("resume_prompt_draft");
            localStorage.removeItem("resume_template_draft");

            // Redirect to resume view page
            window.location.href = `/dashboard/job-seeker/resume/${data.resumeId}`;
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate resume. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteClick = (resumeId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setResumeToDelete(resumeId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!resumeToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/resume/${resumeToDelete}/delete`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete resume");

            toast.success("Resume deleted successfully!");
            setAllResumes(allResumes.filter(r => r.id !== resumeToDelete));
            setDeleteDialogOpen(false);
            setResumeToDelete(null);
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete resume");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSetDefault = async (resumeId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSettingDefault(resumeId);
        try {
            const response = await fetch(`/api/resume/${resumeId}/default`, {
                method: "PATCH",
            });

            if (!response.ok) throw new Error("Failed to set default resume");

            setAllResumes(allResumes.map(r => ({
                ...r,
                isDefault: r.id === resumeId
            })));
            toast.success("Default resume updated");
        } catch (error) {
            console.error(error);
            toast.error("Failed to set default resume");
        } finally {
            setSettingDefault(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Create Your Perfect Resume
                </h1>
                <p className="text-muted-foreground text-lg">
                    Choose a template and let AI craft your professional resume in seconds
                </p>
            </div>

            {/* Main Content */}
            <div className="grid gap-8 lg:grid-cols-2">
                {/* Template Selection */}
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Step 1: Choose Your Template
                        </CardTitle>
                        <CardDescription>Select a design that matches your style and industry</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {TEMPLATES.map((template) => (
                            <div
                                key={template.id}
                                className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${selectedTemplate === template.id
                                    ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
                                    : "border-gray-200 hover:border-gray-400 hover:shadow-md"
                                    }`}
                                onClick={() => setSelectedTemplate(template.id)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center flex-shrink-0`}>
                                        <FileText className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg mb-1">{template.name}</h3>
                                        <p className="text-sm text-muted-foreground">{template.description}</p>
                                    </div>
                                    {selectedTemplate === template.id && (
                                        <div className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* AI Prompt */}
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Step 2: Tell Us About Yourself
                        </CardTitle>
                        <CardDescription>Share your experience, skills, and education</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="prompt" className="text-base font-medium">Your Professional Details</Label>
                            <Textarea
                                id="prompt"
                                placeholder="Example: I am a Full Stack Developer with 5 years of experience in React, Node.js, and MongoDB. I have built scalable web applications for e-commerce and fintech companies. I hold a B.S. in Computer Science from MIT and am proficient in TypeScript, AWS, and Docker..."
                                className="min-h-[300px] text-base resize-none"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                            <p className="text-sm text-muted-foreground">
                                💡 Tip: Include your job title, years of experience, key skills, education, and notable achievements
                            </p>
                        </div>
                        <Button
                            className="w-full h-12 text-lg font-semibold"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            size="lg"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Generating Your Resume...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    Generate Resume with AI
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* All Resumes */}
            {!loadingResumes && allResumes.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Your Resumes ({allResumes.length})
                        </CardTitle>
                        <CardDescription>All your created resumes in one place</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {allResumes.map((resume) => (
                                <Link
                                    key={resume.id}
                                    href={`/dashboard/job-seeker/resume/${resume.id}`}
                                    className="block group"
                                >
                                    <Card className={`hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer border-2 relative ${resume.isDefault ? 'border-primary bg-primary/5' : 'hover:border-primary'}`}>
                                        <CardContent className="p-4">
                                            <div className="absolute top-2 right-2 flex gap-1 z-10">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={`h-8 w-8 p-0 ${resume.isDefault ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                                                    onClick={(e) => handleSetDefault(resume.id, e)}
                                                    title={resume.isDefault ? "Default Resume" : "Set as Default"}
                                                >
                                                    {settingDefault === resume.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Star className={`h-4 w-4 ${resume.isDefault ? 'fill-current' : ''}`} />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={(e) => handleDeleteClick(resume.id, e)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold truncate">{resume.title}</h3>
                                                        {resume.isDefault && (
                                                            <Badge variant="secondary" className="text-[10px] h-5 px-1">Default</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Created: {new Date(resume.createdAt).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Updated: {new Date(resume.updatedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Resume?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your resume.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
