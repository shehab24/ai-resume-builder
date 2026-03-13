"use client";

import { useState, useEffect } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles, FileText, Clock, Trash2, Star, Eye, X, LogIn, Download, Edit } from "lucide-react";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { ResumeTemplate } from "@/components/resume-templates";

const TEMPLATES = [
    {
        id: "professional",
        name: "Professional",
        description: "Clean and professional design with a dark header.",
        image: "/templates/professional.png"
    },
    {
        id: "modern",
        name: "Modern",
        description: "Contemporary design with a sidebar layout.",
        image: "/templates/modern.png"
    },
    {
        id: "classic",
        name: "Classic",
        description: "Traditional layout perfect for any industry.",
        image: "/templates/classic.png"
    },
];

interface Resume {
    id: string;
    title: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ResumeLimit {
    canCreate: boolean;
    count: number;
    limit: string | number;
    isPro: boolean;
}

export default function CreateResumePage() {
    const { isSignedIn } = useAuth();
    const [selectedTemplate, setSelectedTemplate] = useState("professional");
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [allResumes, setAllResumes] = useState<Resume[]>([]);
    const [loadingResumes, setLoadingResumes] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [settingDefault, setSettingDefault] = useState<string | null>(null);
    const [resumeLimit, setResumeLimit] = useState<ResumeLimit | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<any>(null); // Store generated resume before saving
    const [showPreview, setShowPreview] = useState(false);
    const [editableResume, setEditableResume] = useState<any>(null);
    const [showEditMode, setShowEditMode] = useState(false);
    const [showDesignPanel, setShowDesignPanel] = useState(false);

    useEffect(() => {
        fetchAllResumes();
        fetchResumeLimit();

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

    const fetchResumeLimit = async () => {
        if (!isSignedIn) {
            setResumeLimit(null);
            return;
        }
        try {
            const response = await fetch("/api/user/resume-limit");
            if (response.ok) {
                const data = await response.json();
                setResumeLimit(data);
            }
        } catch (error) {
            console.error("Error fetching resume limit:", error);
        }
    };

    const fetchAllResumes = async () => {
        if (!isSignedIn) {
            setAllResumes([]);
            setLoadingResumes(false);
            return;
        }
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
            // If user is not signed in, generate preview only
            if (!isSignedIn) {
                const response = await fetch("/api/resume/preview", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        personalInfo: {},
                        professionalSummary: prompt,
                        skills: [],
                        experience: [],
                        education: []
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to generate preview");
                }

                const data = await response.json();
                
                // Store the generated content and template
                setGeneratedContent({
                    content: data.content,
                    prompt: prompt,
                    templateId: selectedTemplate
                });
                
                // Set editable resume for preview
                setEditableResume(data.content);
                
                // Store in localStorage as backup
                localStorage.setItem("pending_resume", JSON.stringify({
                    content: data.content,
                    prompt: prompt,
                    templateId: selectedTemplate,
                    timestamp: new Date().toISOString()
                }));
                
                // Show preview section
                setShowPreview(true);
                
                toast.success("✅ Resume generated successfully!");
                toast.info("Review and edit your resume below, then save to download", {
                    duration: 5000,
                });
                
                setIsGenerating(false);
                
                // Scroll to preview
                setTimeout(() => {
                    document.getElementById('resume-preview')?.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 100);
                
                return;
            }

            // For authenticated users, generate and save immediately
            const response = await fetch("/api/resume/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, templateId: selectedTemplate }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific error types
                if (data.errorType === "API_KEY_ERROR") {
                    toast.error("🔑 API Key Error", {
                        description: data.message || "Your Gemini API key is invalid or expired.",
                        duration: 6000,
                    });
                } else if (data.errorType === "QUOTA_ERROR") {
                    toast.error("⚠️ Quota Exceeded", {
                        description: data.message || "You've exceeded your API quota. Please try again later.",
                        duration: 6000,
                    });
                } else if (data.errorType === "MODEL_ERROR") {
                    toast.error("🤖 Model Error", {
                        description: data.message || "The AI model is not available.",
                        duration: 6000,
                    });
                } else if (data.errorType === "NETWORK_ERROR") {
                    toast.error("🌐 Network Error", {
                        description: data.message || "Unable to connect. Check your internet connection.",
                        duration: 6000,
                    });
                } else {
                    toast.error("❌ Error", {
                        description: data.message || "Failed to generate resume. Please try again.",
                        duration: 5000,
                    });
                }
                return;
            }

            toast.success("✅ Resume generated successfully!");

            // Clear draft and pending resume
            localStorage.removeItem("resume_prompt_draft");
            localStorage.removeItem("resume_template_draft");
            localStorage.removeItem("pending_resume"); // Clear pending resume to prevent duplicate saves

            // Redirect to resume view page
            window.location.href = `/dashboard/job-seeker/resume/${data.resumeId}`;
        } catch (error) {
            console.error(error);
            toast.error("❌ Unexpected Error", {
                description: "Something went wrong. Please try again.",
                duration: 5000,
            });
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

    const handleSaveResume = async () => {
        if (!isSignedIn) {
            setShowLoginPrompt(true);
            toast.error("Please sign in to save your resume");
            return;
        }

        if (!editableResume) {
            toast.error("No resume to save. Please generate a resume first.");
            return;
        }

        // Check if there's a pending resume in localStorage
        const pendingResume = localStorage.getItem("pending_resume");
        if (pendingResume) {
            // If there's a pending resume, redirect to dashboard
            // The dashboard will handle the auto-save
            console.log("Frontend: Pending resume detected, redirecting to dashboard...");
            window.location.href = "/dashboard/job-seeker/resume/create";
            return;
        }

        console.log("Frontend: Starting save process...");
        console.log("Frontend: editableResume:", editableResume);
        console.log("Frontend: selectedTemplate:", selectedTemplate);

        setIsGenerating(true);
        try {
            // Save the resume with the current template and content
            const response = await fetch("/api/resume/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    templateId: selectedTemplate,
                    personalInfo: editableResume.personalInfo,
                    summary: editableResume.summary,
                    skills: editableResume.skills,
                    experience: editableResume.experience,
                    education: editableResume.education,
                }),
            });

            const data = await response.json();

            console.log("Frontend: Save response:", data);

            if (!response.ok) {
                throw new Error(data.message || "Failed to save resume");
            }

            toast.success("✅ Resume saved successfully!");

            // Clear the preview state and localStorage
            setShowPreview(false);
            setShowEditMode(false);
            setEditableResume(null);
            setPrompt("");
            localStorage.removeItem("pending_resume");

            // Refresh the resumes list
            await fetchAllResumes();

            console.log("Frontend: Redirecting to resume view...");

            // Redirect to resume view page
            window.location.href = `/dashboard/job-seeker/resume/${data.resumeId}`;
        } catch (error) {
            console.error("Frontend: Save error:", error);
            toast.error("Failed to save resume. Please try again.");
        } finally {
            setIsGenerating(false);
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
                {resumeLimit && (
                    <p className="text-sm text-muted-foreground">
                        You have created {resumeLimit.count} of {resumeLimit.limit} resumes
                    </p>
                )}
            </div>

            {/* Info banner for unauthenticated users */}
            {!isSignedIn && (
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                    Try Our AI Resume Builder - No Sign Up Required!
                                </h3>
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    Fill in your details below and preview your AI-enhanced resume. You'll only need to sign in when you're ready to save and download.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Show upgrade prompt if limit reached */}
            {resumeLimit && !resumeLimit.canCreate ? (
                <UpgradePrompt
                    title="Resume Limit Reached"
                    message={`You've reached the maximum of ${resumeLimit.limit} resumes for free users.`}
                    feature="Upgrade to Pro for unlimited AI-generated resumes and more premium features!"
                    price={299}
                />
            ) : (
                <>
                    {/* Main Content - Single Column Layout */}
                    {!showPreview && (
                        <div className="space-y-8">
                            {/* Step 1: Template Selection */}
                            <Card className="border-2">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        Step 1: Choose Your Template
                                    </CardTitle>
                                    <CardDescription>Select a design that matches your style and industry</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {TEMPLATES.map((template) => (
                                            <div
                                                key={template.id}
                                                className={`relative border-2 rounded-xl cursor-pointer transition-all duration-200 overflow-hidden group ${selectedTemplate === template.id
                                                    ? "border-primary ring-2 ring-primary ring-offset-2"
                                                    : "border-gray-200 hover:border-gray-400 hover:shadow-md"
                                                    }`}
                                                onClick={() => setSelectedTemplate(template.id)}
                                            >
                                                <div className="aspect-[210/297] w-full relative bg-gray-100">
                                                    <img
                                                        src={template.image}
                                                        alt={template.name}
                                                        className="w-full h-full object-cover object-top"
                                                    />
                                                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity duration-200 ${selectedTemplate === template.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                                        <Button
                                                            size="icon"
                                                            variant="secondary"
                                                            className="rounded-full h-10 w-10"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPreviewImage(template.image);
                                                            }}
                                                            title="Preview Template"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </Button>
                                                        {selectedTemplate === template.id ? (
                                                            <div className="bg-primary text-white rounded-full p-2 shadow-lg">
                                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                variant="default"
                                                                className="rounded-full"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedTemplate(template.id);
                                                                }}
                                                            >
                                                                Select
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-3">
                                                    <h3 className="font-bold text-base mb-1">{template.name}</h3>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Step 2: AI Prompt */}
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
                                            className="min-h-[200px] text-base resize-none"
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
                    )}
                </>
            )}

            {/* Resume Preview & Edit Section */}
            {showPreview && editableResume && !showEditMode && (
                <div id="resume-preview" className="space-y-6">
                    {/* Preview Header with Actions */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold">Resume Preview</h2>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                size="default"
                                onClick={() => setShowDesignPanel(true)}
                            >
                                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                                Design
                            </Button>
                            <Button
                                variant="outline"
                                size="default"
                                onClick={() => setShowEditMode(true)}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                            <Button
                                onClick={handleSaveResume}
                                className="bg-black hover:bg-gray-800 text-white"
                                disabled={isGenerating}
                                size="default"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Downloading...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download PDF
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Visual Resume Preview Card */}
                    <Card className="bg-white shadow-lg">
                        <CardContent className="p-12">
                            <ResumeTemplate 
                                data={editableResume} 
                                template={selectedTemplate as 'professional' | 'modern' | 'classic'}
                            />
                        </CardContent>
                    </Card>

                    {/* Design Panel Sidebar */}
                    {showDesignPanel && (
                        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowDesignPanel(false)}>
                            <div 
                                className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl p-6 overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold">Customize Resume</h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowDesignPanel(false)}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                <p className="text-sm text-muted-foreground mb-6">
                                    Change the layout, font, and color theme of your resume.
                                </p>

                                {/* Layout Style */}
                                <div className="space-y-4 mb-6">
                                    <Label className="text-base font-semibold">Layout Style</Label>
                                    {TEMPLATES.map((template) => (
                                        <div
                                            key={template.id}
                                            className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                selectedTemplate === template.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => setSelectedTemplate(template.id)}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                selectedTemplate === template.id ? 'border-primary' : 'border-gray-300'
                                            }`}>
                                                {selectedTemplate === template.id && (
                                                    <div className="w-3 h-3 rounded-full bg-primary" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{template.name}</p>
                                                <p className="text-xs text-muted-foreground">{template.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    className="w-full"
                                    onClick={() => setShowDesignPanel(false)}
                                >
                                    Apply Changes
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Mode - Full Page Editable Form */}
            {showEditMode && editableResume && (
                <div className="space-y-6">
                    {/* Edit Mode Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold">Resume Preview</h2>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                size="default"
                                onClick={() => setShowDesignPanel(true)}
                            >
                                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                                Design
                            </Button>
                            <Button
                                variant="outline"
                                size="default"
                                onClick={() => setShowEditMode(false)}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                            <Button
                                variant="outline"
                                size="default"
                                onClick={() => setShowEditMode(false)}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveResume}
                                className="bg-black hover:bg-gray-800 text-white"
                                disabled={isGenerating}
                                size="default"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Save
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Editable Form */}
                    <Card className="bg-white shadow-lg">
                        <CardContent className="p-8 space-y-6">
                            {/* Personal Info */}
                            <div className="space-y-4">
                                <div className="text-center">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mx-auto mb-4" />
                                    <input
                                        type="text"
                                        className="text-center text-2xl font-bold border-b-2 border-transparent hover:border-gray-300 focus:border-primary outline-none w-full max-w-md mx-auto"
                                        value={editableResume.personalInfo?.fullName || ''}
                                        onChange={(e) => setEditableResume({
                                            ...editableResume,
                                            personalInfo: { ...editableResume.personalInfo, fullName: e.target.value }
                                        })}
                                        placeholder="Your Name"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                                    <input
                                        type="email"
                                        className="px-4 py-2 border rounded-lg"
                                        value={editableResume.personalInfo?.email || ''}
                                        onChange={(e) => setEditableResume({
                                            ...editableResume,
                                            personalInfo: { ...editableResume.personalInfo, email: e.target.value }
                                        })}
                                        placeholder="Email"
                                    />
                                    <input
                                        type="tel"
                                        className="px-4 py-2 border rounded-lg"
                                        value={editableResume.personalInfo?.phone || ''}
                                        onChange={(e) => setEditableResume({
                                            ...editableResume,
                                            personalInfo: { ...editableResume.personalInfo, phone: e.target.value }
                                        })}
                                        placeholder="Phone"
                                    />
                                </div>
                            </div>

                            {/* Professional Summary */}
                            <div>
                                <h3 className="text-xl font-bold mb-2 uppercase">Professional Summary</h3>
                                <Textarea
                                    className="min-h-[100px]"
                                    value={editableResume.summary || ''}
                                    onChange={(e) => setEditableResume({ ...editableResume, summary: e.target.value })}
                                    placeholder="Your professional summary..."
                                />
                            </div>

                            {/* Experience */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold uppercase">Experience</h3>
                                    <Button size="sm" variant="outline">
                                        <span className="mr-1">+</span> Add
                                    </Button>
                                </div>
                                {editableResume.experience?.map((exp: any, index: number) => (
                                    <Card key={index} className="mb-4">
                                        <CardContent className="pt-4 space-y-3">
                                            <div className="flex justify-end">
                                                <Button size="sm" variant="ghost" className="text-red-500">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border rounded-lg font-semibold"
                                                value={exp.position}
                                                placeholder="Position"
                                            />
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border rounded-lg"
                                                value={exp.company}
                                                placeholder="Company"
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    className="px-3 py-2 border rounded-lg text-sm"
                                                    value={exp.startDate}
                                                    placeholder="Start Date"
                                                />
                                                <input
                                                    type="text"
                                                    className="px-3 py-2 border rounded-lg text-sm"
                                                    value={exp.endDate}
                                                    placeholder="End Date"
                                                />
                                            </div>
                                            <Textarea
                                                className="min-h-[80px]"
                                                value={exp.description}
                                                placeholder="Description"
                                            />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Design Panel for Edit Mode */}
                    {showDesignPanel && (
                        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowDesignPanel(false)}>
                            <div 
                                className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl p-6 overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold">Customize Resume</h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowDesignPanel(false)}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                <p className="text-sm text-muted-foreground mb-6">
                                    Change the layout, font, and color theme of your resume.
                                </p>

                                {/* Layout Style */}
                                <div className="space-y-4 mb-6">
                                    <Label className="text-base font-semibold">Layout Style</Label>
                                    {TEMPLATES.map((template) => (
                                        <div
                                            key={template.id}
                                            className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                selectedTemplate === template.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => setSelectedTemplate(template.id)}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                selectedTemplate === template.id ? 'border-primary' : 'border-gray-300'
                                            }`}>
                                                {selectedTemplate === template.id && (
                                                    <div className="w-3 h-3 rounded-full bg-primary" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{template.name}</p>
                                                <p className="text-xs text-muted-foreground">{template.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    className="w-full"
                                    onClick={() => setShowDesignPanel(false)}
                                >
                                    Apply Changes
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* All Resumes */}
            {
                !loadingResumes && allResumes.length > 0 && (
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
                )
            }

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
            {/* Template Preview Dialog */}
            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center outline-none">
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-4 right-4 z-50 rounded-full shadow-lg border-2 border-white"
                            onClick={() => setPreviewImage(null)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        {previewImage && (
                            <img
                                src={previewImage}
                                alt="Template Preview"
                                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl bg-white"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Login Prompt Dialog */}
            <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center text-center space-y-4 py-6">
                        <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <LogIn className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">Sign in to Save Your Resume</h3>
                            <p className="text-sm text-muted-foreground">
                                Create a free account to generate, save, and download your AI-powered resume
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 w-full pt-4">
                            <SignInButton 
                                mode="modal"
                                fallbackRedirectUrl="/dashboard/job-seeker/resume/create"
                            >
                                <Button className="w-full" size="lg">
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Sign In to Continue
                                </Button>
                            </SignInButton>
                            <Button
                                variant="outline"
                                onClick={() => setShowLoginPrompt(false)}
                                className="w-full"
                            >
                                Continue Editing
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
