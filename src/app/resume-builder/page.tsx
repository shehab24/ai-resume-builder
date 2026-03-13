"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, X, Eye, FileText, Download, LogIn } from "lucide-react";
import { toast } from "sonner";
import { SignInButton } from "@clerk/nextjs";

interface ResumeContent {
    summary: string;
    skills: string[];
    experience: Array<{
        position: string;
        company: string;
        startDate: string;
        endDate: string;
        description: string;
    }>;
    education: Array<{
        degree: string;
        school: string;
        year: string;
    }>;
}

export default function PublicResumeBuilderPage() {
    const router = useRouter();
    const { isSignedIn } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [generatedResume, setGeneratedResume] = useState<ResumeContent | null>(null);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        location: "",
        professionalSummary: "",
        skills: [""],
        experience: [{ position: "", company: "", startDate: "", endDate: "", description: "" }],
        education: [{ degree: "", school: "", year: "" }],
    });

    const addSkill = () => setFormData({ ...formData, skills: [...formData.skills, ""] });
    const removeSkill = (index: number) => {
        const newSkills = formData.skills.filter((_, i) => i !== index);
        setFormData({ ...formData, skills: newSkills });
    };
    const updateSkill = (index: number, value: string) => {
        const newSkills = [...formData.skills];
        newSkills[index] = value;
        setFormData({ ...formData, skills: newSkills });
    };

    const addExperience = () => {
        setFormData({
            ...formData,
            experience: [...formData.experience, { position: "", company: "", startDate: "", endDate: "", description: "" }],
        });
    };
    const removeExperience = (index: number) => {
        const newExperience = formData.experience.filter((_, i) => i !== index);
        setFormData({ ...formData, experience: newExperience });
    };
    const updateExperience = (index: number, field: string, value: string) => {
        const newExperience = [...formData.experience];
        newExperience[index] = { ...newExperience[index], [field]: value };
        setFormData({ ...formData, experience: newExperience });
    };

    const addEducation = () => {
        setFormData({
            ...formData,
            education: [...formData.education, { degree: "", school: "", year: "" }],
        });
    };
    const removeEducation = (index: number) => {
        const newEducation = formData.education.filter((_, i) => i !== index);
        setFormData({ ...formData, education: newEducation });
    };
    const updateEducation = (index: number, field: string, value: string) => {
        const newEducation = [...formData.education];
        newEducation[index] = { ...newEducation[index], [field]: value };
        setFormData({ ...formData, education: newEducation });
    };

    const handleGeneratePreview = async () => {
        // Validate required fields
        if (!formData.fullName || !formData.email) {
            toast.error("Please fill in at least your name and email");
            return;
        }

        setIsGenerating(true);

        try {
            // Call AI to enhance the resume content
            const response = await fetch("/api/resume/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    personalInfo: {
                        fullName: formData.fullName,
                        email: formData.email,
                        phone: formData.phone,
                        location: formData.location,
                    },
                    professionalSummary: formData.professionalSummary,
                    skills: formData.skills.filter(s => s.trim()),
                    experience: formData.experience.filter(e => e.position && e.company),
                    education: formData.education.filter(e => e.degree && e.school),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate preview");
            }

            const data = await response.json();
            setGeneratedResume(data.content);
            toast.success("Resume preview generated!");
            
            // Scroll to preview
            setTimeout(() => {
                document.getElementById('resume-preview')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (error) {
            console.error("Error generating preview:", error);
            toast.error("Failed to generate preview");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveAndDownload = async () => {
        // Check if user is signed in
        if (!isSignedIn) {
            setShowLoginPrompt(true);
            toast.error("Please sign in to save and download your resume");
            return;
        }

        if (!generatedResume) {
            toast.error("Please generate a preview first");
            return;
        }

        setIsSaving(true);

        try {
            const response = await fetch("/api/resume/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    personalInfo: {
                        fullName: formData.fullName,
                        email: formData.email,
                        phone: formData.phone,
                        location: formData.location,
                    },
                    professionalSummary: formData.professionalSummary,
                    skills: formData.skills.filter(s => s.trim()),
                    experience: formData.experience.filter(e => e.position && e.company),
                    education: formData.education.filter(e => e.degree && e.school),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save resume");
            }

            const data = await response.json();
            toast.success("Resume saved successfully!");
            
            // Redirect to the resume view/download page
            router.push(`/dashboard/job-seeker/resume/${data.resume.id}`);
        } catch (error) {
            console.error("Error saving resume:", error);
            toast.error(error instanceof Error ? error.message : "Failed to save resume");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            AI Resume Builder
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground">
                        Create a professional resume in minutes with AI assistance - No login required!
                    </p>
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200">
                            ✨ Generate and preview your resume for FREE. Sign in only when you're ready to download!
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form Column */}
                    <div>
                        <Card className="shadow-xl sticky top-4">
                            <CardHeader>
                                <CardTitle>Your Information</CardTitle>
                                <CardDescription>Fill in your details to create your resume</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                                {/* Personal Information */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <span className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm">1</span>
                                        Personal Information
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName">Full Name *</Label>
                                            <Input
                                                id="fullName"
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                placeholder="John Doe"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="john@example.com"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="+1 234 567 8900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="location">Location</Label>
                                            <Input
                                                id="location"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                placeholder="New York, USA"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Professional Summary */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <span className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm">2</span>
                                        Professional Summary
                                    </h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="summary">Brief summary</Label>
                                        <Textarea
                                            id="summary"
                                            value={formData.professionalSummary}
                                            onChange={(e) => setFormData({ ...formData, professionalSummary: e.target.value })}
                                            placeholder="Experienced software developer..."
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                {/* Skills */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <span className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 flex items-center justify-center text-sm">3</span>
                                            Skills
                                        </h3>
                                        <Button type="button" variant="outline" size="sm" onClick={addSkill}>
                                            <Plus className="h-4 w-4 mr-1" /> Add
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.skills.map((skill, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Input
                                                    value={skill}
                                                    onChange={(e) => updateSkill(index, e.target.value)}
                                                    placeholder="e.g., JavaScript"
                                                />
                                                {formData.skills.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeSkill(index)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Experience */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <span className="h-6 w-6 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 flex items-center justify-center text-sm">4</span>
                                            Experience
                                        </h3>
                                        <Button type="button" variant="outline" size="sm" onClick={addExperience}>
                                            <Plus className="h-4 w-4 mr-1" /> Add
                                        </Button>
                                    </div>
                                    {formData.experience.map((exp, index) => (
                                        <Card key={index} className="p-3 bg-muted/50">
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium">#{index + 1}</span>
                                                    {formData.experience.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeExperience(index)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                                <Input
                                                    value={exp.position}
                                                    onChange={(e) => updateExperience(index, "position", e.target.value)}
                                                    placeholder="Job Title"
                                                />
                                                <Input
                                                    value={exp.company}
                                                    onChange={(e) => updateExperience(index, "company", e.target.value)}
                                                    placeholder="Company"
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Input
                                                        value={exp.startDate}
                                                        onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                                                        placeholder="Start"
                                                    />
                                                    <Input
                                                        value={exp.endDate}
                                                        onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                                                        placeholder="End"
                                                    />
                                                </div>
                                                <Textarea
                                                    value={exp.description}
                                                    onChange={(e) => updateExperience(index, "description", e.target.value)}
                                                    placeholder="Description..."
                                                    rows={2}
                                                />
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {/* Education */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <span className="h-6 w-6 rounded-full bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400 flex items-center justify-center text-sm">5</span>
                                            Education
                                        </h3>
                                        <Button type="button" variant="outline" size="sm" onClick={addEducation}>
                                            <Plus className="h-4 w-4 mr-1" /> Add
                                        </Button>
                                    </div>
                                    {formData.education.map((edu, index) => (
                                        <Card key={index} className="p-3 bg-muted/50">
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium">#{index + 1}</span>
                                                    {formData.education.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeEducation(index)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                                <Input
                                                    value={edu.degree}
                                                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                                                    placeholder="Degree"
                                                />
                                                <Input
                                                    value={edu.school}
                                                    onChange={(e) => updateEducation(index, "school", e.target.value)}
                                                    placeholder="School/University"
                                                />
                                                <Input
                                                    value={edu.year}
                                                    onChange={(e) => updateEducation(index, "year", e.target.value)}
                                                    placeholder="Year"
                                                />
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {/* Generate Button */}
                                <Button
                                    onClick={handleGeneratePreview}
                                    disabled={isGenerating}
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Generating Preview...
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="mr-2 h-5 w-5" />
                                            Generate Preview
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Preview Column */}
                    <div id="resume-preview">
                        <Card className="shadow-xl sticky top-4">
                            <CardHeader>
                                <CardTitle>Resume Preview</CardTitle>
                                <CardDescription>
                                    {generatedResume ? "Your AI-enhanced resume" : "Preview will appear here"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!generatedResume ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                        <FileText className="h-16 w-16 mb-4 opacity-20" />
                                        <p>Fill out the form and click "Generate Preview"</p>
                                        <p className="text-sm mt-2">Your resume will appear here</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Personal Info */}
                                        <div className="border-b pb-4">
                                            <h2 className="text-2xl font-bold">{formData.fullName}</h2>
                                            <p className="text-sm text-muted-foreground">{formData.email}</p>
                                            {formData.phone && <p className="text-sm text-muted-foreground">{formData.phone}</p>}
                                            {formData.location && <p className="text-sm text-muted-foreground">{formData.location}</p>}
                                        </div>

                                        {/* Summary */}
                                        {generatedResume.summary && (
                                            <div>
                                                <h3 className="font-semibold mb-2">Professional Summary</h3>
                                                <p className="text-sm">{generatedResume.summary}</p>
                                            </div>
                                        )}

                                        {/* Skills */}
                                        {generatedResume.skills.length > 0 && (
                                            <div>
                                                <h3 className="font-semibold mb-2">Skills</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {generatedResume.skills.map((skill, i) => (
                                                        <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Experience */}
                                        {generatedResume.experience.length > 0 && (
                                            <div>
                                                <h3 className="font-semibold mb-2">Experience</h3>
                                                <div className="space-y-3">
                                                    {generatedResume.experience.map((exp, i) => (
                                                        <div key={i} className="border-l-2 border-primary/20 pl-3">
                                                            <h4 className="font-medium">{exp.position}</h4>
                                                            <p className="text-sm text-muted-foreground">{exp.company} • {exp.startDate} - {exp.endDate}</p>
                                                            <p className="text-sm mt-1">{exp.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Education */}
                                        {generatedResume.education.length > 0 && (
                                            <div>
                                                <h3 className="font-semibold mb-2">Education</h3>
                                                <div className="space-y-2">
                                                    {generatedResume.education.map((edu, i) => (
                                                        <div key={i}>
                                                            <h4 className="font-medium">{edu.degree}</h4>
                                                            <p className="text-sm text-muted-foreground">{edu.school} • {edu.year}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Download Section */}
                                        <div className="pt-4 border-t">
                                            {showLoginPrompt && !isSignedIn ? (
                                                <div className="space-y-3">
                                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                                                        <LogIn className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                                        <h3 className="font-semibold mb-2">Sign in to Download</h3>
                                                        <p className="text-sm text-muted-foreground mb-3">
                                                            Create a free account to save and download your resume
                                                        </p>
                                                        <SignInButton mode="modal">
                                                            <Button className="w-full">
                                                                <LogIn className="mr-2 h-4 w-4" />
                                                                Sign In to Download
                                                            </Button>
                                                        </SignInButton>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button
                                                    onClick={handleSaveAndDownload}
                                                    disabled={isSaving}
                                                    size="lg"
                                                    className="w-full"
                                                >
                                                    {isSaving ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Download className="mr-2 h-5 w-5" />
                                                            {isSignedIn ? "Save & Download Resume" : "Download Resume"}
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
