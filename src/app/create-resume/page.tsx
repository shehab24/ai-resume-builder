"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { ResumeTemplate } from "@/components/resume-templates";
import { Card, CardContent } from "@/components/ui/card";

// Constants and Components
import { TEMPLATES, Resume, ResumeLimit } from "./constants";
import { TemplateSelector } from "./_components/TemplateSelector";
import { MultiStepForm } from "./_components/MultiStepForm";
import { ResumeList } from "./_components/ResumeList";
import { ResumeDesignPanel } from "./_components/ResumeDesignPanel";
import { ResumeEditForm } from "./_components/ResumeEditForm";
import { ResumePreviewActions } from "./_components/ResumePreviewActions";
import { UnauthenticatedBanner } from "./_components/UnauthenticatedBanner";
import { CreateResumeDialogs } from "./_components/CreateResumeDialogs";

export default function CreateResumePage() {
    const { isSignedIn } = useAuth();
    const [selectedTemplate, setSelectedTemplate] = useState("professional");
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
    const [generatedContent, setGeneratedContent] = useState<any>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [editableResume, setEditableResume] = useState<any>(null);
    const [showEditMode, setShowEditMode] = useState(false);
    const [showDesignPanel, setShowDesignPanel] = useState(false);

    useEffect(() => {
        fetchAllResumes();
        fetchResumeLimit();

        // Load saved template draft
        const savedTemplate = localStorage.getItem("resume_template_draft");
        if (savedTemplate) setSelectedTemplate(savedTemplate);
    }, []);

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

    const handleGenerate = async (finalPrompt: string) => {
        if (!finalPrompt.trim()) {
            toast.error("Resume data is missing. Please fill the form.");
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
                        professionalSummary: finalPrompt,
                        skills: [],
                        experience: [],
                        education: []
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to generate preview");
                }

                const data = await response.json();

                setGeneratedContent({
                    content: data.content,
                    prompt: finalPrompt,
                    templateId: selectedTemplate
                });

                setEditableResume(data.content);

                localStorage.setItem("pending_resume", JSON.stringify({
                    content: data.content,
                    prompt: finalPrompt,
                    templateId: selectedTemplate,
                    timestamp: new Date().toISOString()
                }));

                setShowPreview(true);
                
                toast.success("✅ Resume generated successfully!");
                toast.info("Review and edit your resume below, then save to download", {
                    duration: 5000,
                });
                
                setIsGenerating(false);

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
                body: JSON.stringify({ prompt: finalPrompt, templateId: selectedTemplate }),
            });

            const data = await response.json();

            if (!response.ok) {
                handleApiError(data);
                return;
            }

            toast.success("✅ Resume generated successfully!");
            localStorage.removeItem("pending_resume");
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

    const handleApiError = (data: any) => {
        const errors: Record<string, { title: string, desc: string }> = {
            "API_KEY_ERROR": { title: "🔑 API Key Error", desc: data.message || "Your Gemini API key is invalid or expired." },
            "QUOTA_ERROR": { title: "⚠️ Quota Exceeded", desc: data.message || "You've exceeded your API quota. Please try again later." },
            "MODEL_ERROR": { title: "🤖 Model Error", desc: data.message || "The AI model is not available." },
            "NETWORK_ERROR": { title: "🌐 Network Error", desc: data.message || "Unable to connect. Check your internet connection." },
        };

        const error = errors[data.errorType] || { title: "❌ Error", desc: data.message || "Failed to generate resume. Please try again." };
        toast.error(error.title, { description: error.desc, duration: 6000 });
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

        const pendingResume = localStorage.getItem("pending_resume");
        if (pendingResume) {
            window.location.href = "/dashboard/job-seeker/resume/create";
            return;
        }

        setIsGenerating(true);
        try {
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

            if (!response.ok) throw new Error(data.message || "Failed to save resume");

            toast.success("✅ Resume saved successfully!");
            setShowPreview(false);
            setShowEditMode(false);
            setEditableResume(null);
            localStorage.removeItem("pending_resume");
            await fetchAllResumes();
            window.location.href = `/dashboard/job-seeker/resume/${data.resumeId}`;
        } catch (error) {
            console.error(error);
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
            {!isSignedIn && <UnauthenticatedBanner />}

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
                        {/* Main Content - Template Selection & Multi-Step Form */}
                    {!showPreview && (
                        <div className="space-y-8">
                                <TemplateSelector
                                    selectedTemplate={selectedTemplate}
                                    onSelect={setSelectedTemplate}
                                    onPreview={setPreviewImage}
                                />

                                <MultiStepForm
                                    handleGenerate={handleGenerate}
                                    isGenerating={isGenerating}
                                />
                        </div>
                    )}
                </>
            )}

            {/* Resume Preview Section */}
            {showPreview && editableResume && !showEditMode && (
                <div id="resume-preview" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold">Resume Preview</h2>
                        <ResumePreviewActions
                            isEditMode={false}
                            setShowDesignPanel={setShowDesignPanel}
                            setShowEditMode={setShowEditMode}
                            handleSaveResume={handleSaveResume}
                            isGenerating={isGenerating}
                        />
                    </div>

                    <Card className="bg-white shadow-lg">
                        <CardContent className="p-12">
                            <ResumeTemplate 
                                data={editableResume} 
                                template={selectedTemplate as 'professional' | 'modern' | 'classic'}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Edit Mode Section */}
            {showEditMode && editableResume && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold">Resume Preview</h2>
                        <ResumePreviewActions
                            isEditMode={true}
                            setShowDesignPanel={setShowDesignPanel}
                            setShowEditMode={setShowEditMode}
                            handleSaveResume={handleSaveResume}
                            isGenerating={isGenerating}
                        />
                    </div>

                    <ResumeEditForm
                        editableResume={editableResume}
                        setEditableResume={setEditableResume}
                    />
                </div>
            )}

            {/* Resume List */}
            <ResumeList
                resumes={allResumes}
                loading={loadingResumes}
                settingDefault={settingDefault}
                handleSetDefault={handleSetDefault}
                handleDeleteClick={handleDeleteClick}
            />

            {/* Design Panel Sidebar */}
            <ResumeDesignPanel
                open={showDesignPanel}
                setOpen={setShowDesignPanel}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
            />

            {/* Dialogs */}
            <CreateResumeDialogs
                deleteDialogOpen={deleteDialogOpen}
                setDeleteDialogOpen={setDeleteDialogOpen}
                isDeleting={isDeleting}
                handleDeleteConfirm={handleDeleteConfirm}
                previewImage={previewImage}
                setPreviewImage={setPreviewImage}
                showLoginPrompt={showLoginPrompt}
                setShowLoginPrompt={setShowLoginPrompt}
            />
        </div>
    );
}
