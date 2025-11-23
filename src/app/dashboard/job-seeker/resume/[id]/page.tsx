"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Printer, Edit, Save, X, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ResumeScore } from "@/components/resume-score";
import "./print.css";

interface ResumeData {
    personalInfo: {
        fullName: string;
        email: string;
        phone: string;
        linkedin: string;
        portfolio: string;
        profileImage?: string;
    };
    summary: string;
    experience: Array<{
        title: string;
        company: string;
        startDate: string;
        endDate: string;
        description: string;
    }>;
    education: Array<{
        degree: string;
        school: string;
        graduationDate: string;
    }>;
    skills: string[];
}

// Calculate resume score based on content
function calculateResumeScore(resume: ResumeData): number {
    let score = 0;

    // Personal info completeness (20 points)
    if (resume.personalInfo.fullName) score += 5;
    if (resume.personalInfo.email) score += 5;
    if (resume.personalInfo.phone) score += 5;
    if (resume.personalInfo.linkedin || resume.personalInfo.portfolio) score += 5;

    // Summary (15 points)
    if (resume.summary && resume.summary.length > 50) score += 15;
    else if (resume.summary) score += 8;

    // Experience (30 points)
    if (resume.experience.length >= 3) score += 30;
    else if (resume.experience.length >= 2) score += 20;
    else if (resume.experience.length >= 1) score += 10;

    // Education (20 points)
    if (resume.education.length >= 2) score += 20;
    else if (resume.education.length >= 1) score += 15;

    // Skills (15 points)
    if (resume.skills.length >= 10) score += 15;
    else if (resume.skills.length >= 5) score += 10;
    else if (resume.skills.length >= 3) score += 5;

    return Math.min(score, 100);
}

export default function ResumeViewPage() {
    const params = useParams();
    const [resume, setResume] = useState<ResumeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editedResume, setEditedResume] = useState<ResumeData | null>(null);
    const [resumeScore, setResumeScore] = useState(0);

    useEffect(() => {
        const fetchResume = async () => {
            try {
                const response = await fetch(`/api/resume/${params.id}`);
                if (!response.ok) throw new Error("Failed to fetch resume");
                const data = await response.json();
                const parsedResume = JSON.parse(data.content);
                setResume(parsedResume);
                setEditedResume(parsedResume);
                setResumeScore(calculateResumeScore(parsedResume));
            } catch (error) {
                console.error(error);
                toast.error("Failed to load resume");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchResume();
        }
    }, [params.id]);

    const handlePrint = () => {
        window.print();
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setEditedResume(resume);
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!editedResume) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/resume/${params.id}/update`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: editedResume }),
            });

            if (!response.ok) throw new Error("Failed to save resume");

            setResume(editedResume);
            setResumeScore(calculateResumeScore(editedResume));
            setIsEditing(false);
            toast.success("Resume updated successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save resume");
        } finally {
            setIsSaving(false);
        }
    };

    const addExperience = () => {
        if (!editedResume) return;
        setEditedResume({
            ...editedResume,
            experience: [
                ...editedResume.experience,
                { title: "", company: "", startDate: "", endDate: "", description: "" }
            ]
        });
    };

    const removeExperience = (index: number) => {
        if (!editedResume) return;
        setEditedResume({
            ...editedResume,
            experience: editedResume.experience.filter((_, i) => i !== index)
        });
    };

    const addEducation = () => {
        if (!editedResume) return;
        setEditedResume({
            ...editedResume,
            education: [
                ...editedResume.education,
                { degree: "", school: "", graduationDate: "" }
            ]
        });
    };

    const removeEducation = (index: number) => {
        if (!editedResume) return;
        setEditedResume({
            ...editedResume,
            education: editedResume.education.filter((_, i) => i !== index)
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!resume || !editedResume) {
        return <div className="text-center py-12">Resume not found</div>;
    }

    const displayResume = isEditing ? editedResume : resume;

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-8 print:p-0">
            <div className="flex justify-between items-center print:hidden">
                <h1 className="text-2xl font-bold">Resume Preview</h1>
                <div className="flex gap-2">
                    {!isEditing ? (
                        <>
                            <Button variant="outline" onClick={handleEdit}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                            <Button onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                Download PDF
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={handleCancel}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Card id="resume-card" className="print:shadow-none print:border-none">
                <CardContent className="p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center border-b pb-6">
                        {/* Profile Photo */}
                        {(isEditing || displayResume.personalInfo.profileImage) && (
                            <div className="mb-4 flex flex-col items-center gap-2">
                                {displayResume.personalInfo.profileImage && (
                                    <img
                                        src={displayResume.personalInfo.profileImage}
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 print:border-gray-400"
                                    />
                                )}
                                {isEditing && (
                                    <div className="w-full max-w-md">
                                        <Input
                                            value={editedResume.personalInfo.profileImage || ""}
                                            onChange={(e) => setEditedResume({
                                                ...editedResume,
                                                personalInfo: { ...editedResume.personalInfo, profileImage: e.target.value }
                                            })}
                                            placeholder="Enter image URL (e.g., https://example.com/photo.jpg)"
                                            className="text-sm"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            <Upload className="inline h-3 w-3 mr-1" />
                                            Paste an image URL from Imgur, LinkedIn, or any public source
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {isEditing ? (
                            <Input
                                value={editedResume.personalInfo.fullName}
                                onChange={(e) => setEditedResume({
                                    ...editedResume,
                                    personalInfo: { ...editedResume.personalInfo, fullName: e.target.value }
                                })}
                                className="text-3xl font-bold uppercase tracking-wider text-center mb-2"
                                placeholder="Full Name"
                            />
                        ) : (
                            <h1 className="text-3xl font-bold uppercase tracking-wider">{displayResume.personalInfo.fullName}</h1>
                        )}

                        <div className="flex justify-center gap-4 mt-2 text-sm text-muted-foreground print:text-black flex-wrap">
                            {isEditing ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full max-w-2xl">
                                    <Input
                                        value={editedResume.personalInfo.email}
                                        onChange={(e) => setEditedResume({
                                            ...editedResume,
                                            personalInfo: { ...editedResume.personalInfo, email: e.target.value }
                                        })}
                                        placeholder="Email"
                                        className="text-sm"
                                    />
                                    <Input
                                        value={editedResume.personalInfo.phone}
                                        onChange={(e) => setEditedResume({
                                            ...editedResume,
                                            personalInfo: { ...editedResume.personalInfo, phone: e.target.value }
                                        })}
                                        placeholder="Phone"
                                        className="text-sm"
                                    />
                                    <Input
                                        value={editedResume.personalInfo.linkedin}
                                        onChange={(e) => setEditedResume({
                                            ...editedResume,
                                            personalInfo: { ...editedResume.personalInfo, linkedin: e.target.value }
                                        })}
                                        placeholder="LinkedIn"
                                        className="text-sm"
                                    />
                                </div>
                            ) : (
                                <>
                                    <span>{displayResume.personalInfo.email}</span>
                                    <span>|</span>
                                    <span>{displayResume.personalInfo.phone}</span>
                                    {displayResume.personalInfo.linkedin && (
                                        <>
                                            <span>|</span>
                                            <span>{displayResume.personalInfo.linkedin}</span>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Summary */}
                    <div>
                        <h2 className="text-lg font-bold uppercase border-b mb-2">Professional Summary</h2>
                        {isEditing ? (
                            <Textarea
                                value={editedResume.summary}
                                onChange={(e) => setEditedResume({ ...editedResume, summary: e.target.value })}
                                className="text-sm leading-relaxed min-h-[100px]"
                                placeholder="Write a brief summary of your professional background..."
                            />
                        ) : (
                            <p className="text-sm leading-relaxed">{displayResume.summary}</p>
                        )}
                    </div>

                    {/* Experience */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold uppercase border-b flex-1">Experience</h2>
                            {isEditing && (
                                <Button size="sm" variant="outline" onClick={addExperience} className="print:hidden ml-4">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add
                                </Button>
                            )}
                        </div>
                        <div className="space-y-4">
                            {displayResume.experience.map((exp, index) => (
                                <div key={index} className="relative">
                                    {isEditing ? (
                                        <div className="space-y-2 p-4 border rounded relative">
                                            {displayResume.experience.length > 1 && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => removeExperience(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <div className="grid grid-cols-2 gap-2 pr-8">
                                                <Input
                                                    value={exp.title}
                                                    onChange={(e) => {
                                                        const newExp = [...editedResume.experience];
                                                        newExp[index].title = e.target.value;
                                                        setEditedResume({ ...editedResume, experience: newExp });
                                                    }}
                                                    placeholder="Job Title"
                                                />
                                                <Input
                                                    value={exp.company}
                                                    onChange={(e) => {
                                                        const newExp = [...editedResume.experience];
                                                        newExp[index].company = e.target.value;
                                                        setEditedResume({ ...editedResume, experience: newExp });
                                                    }}
                                                    placeholder="Company"
                                                />
                                                <Input
                                                    value={exp.startDate}
                                                    onChange={(e) => {
                                                        const newExp = [...editedResume.experience];
                                                        newExp[index].startDate = e.target.value;
                                                        setEditedResume({ ...editedResume, experience: newExp });
                                                    }}
                                                    placeholder="Start Date (e.g., Jan 2020)"
                                                />
                                                <Input
                                                    value={exp.endDate}
                                                    onChange={(e) => {
                                                        const newExp = [...editedResume.experience];
                                                        newExp[index].endDate = e.target.value;
                                                        setEditedResume({ ...editedResume, experience: newExp });
                                                    }}
                                                    placeholder="End Date (e.g., Present)"
                                                />
                                            </div>
                                            <Textarea
                                                value={exp.description}
                                                onChange={(e) => {
                                                    const newExp = [...editedResume.experience];
                                                    newExp[index].description = e.target.value;
                                                    setEditedResume({ ...editedResume, experience: newExp });
                                                }}
                                                placeholder="Job description and achievements"
                                                className="min-h-[80px]"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-baseline">
                                                <h3 className="font-bold">{exp.title}</h3>
                                                <span className="text-sm text-muted-foreground print:text-black">
                                                    {exp.startDate} - {exp.endDate}
                                                </span>
                                            </div>
                                            <div className="text-sm font-medium">{exp.company}</div>
                                            <p className="text-sm mt-1 whitespace-pre-line">{exp.description}</p>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Education */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold uppercase border-b flex-1">Education</h2>
                            {isEditing && (
                                <Button size="sm" variant="outline" onClick={addEducation} className="print:hidden ml-4">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add
                                </Button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {displayResume.education.map((edu, index) => (
                                <div key={index}>
                                    {isEditing ? (
                                        <div className="grid grid-cols-3 gap-2 p-4 border rounded relative">
                                            {displayResume.education.length > 1 && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => removeEducation(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Input
                                                value={edu.school}
                                                onChange={(e) => {
                                                    const newEdu = [...editedResume.education];
                                                    newEdu[index].school = e.target.value;
                                                    setEditedResume({ ...editedResume, education: newEdu });
                                                }}
                                                placeholder="School/University"
                                            />
                                            <Input
                                                value={edu.degree}
                                                onChange={(e) => {
                                                    const newEdu = [...editedResume.education];
                                                    newEdu[index].degree = e.target.value;
                                                    setEditedResume({ ...editedResume, education: newEdu });
                                                }}
                                                placeholder="Degree"
                                            />
                                            <Input
                                                value={edu.graduationDate}
                                                onChange={(e) => {
                                                    const newEdu = [...editedResume.education];
                                                    newEdu[index].graduationDate = e.target.value;
                                                    setEditedResume({ ...editedResume, education: newEdu });
                                                }}
                                                placeholder="Graduation Year"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex justify-between">
                                            <div>
                                                <div className="font-bold">{edu.school}</div>
                                                <div className="text-sm">{edu.degree}</div>
                                            </div>
                                            <div className="text-sm text-muted-foreground print:text-black">{edu.graduationDate}</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Skills */}
                    <div>
                        <h2 className="text-lg font-bold uppercase border-b mb-2">Skills</h2>
                        {isEditing ? (
                            <Textarea
                                value={editedResume.skills.join(", ")}
                                onChange={(e) => setEditedResume({
                                    ...editedResume,
                                    skills: e.target.value.split(",").map(s => s.trim()).filter(s => s)
                                })}
                                placeholder="Enter skills separated by commas (e.g., JavaScript, React, Node.js)"
                                className="min-h-[60px]"
                            />
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {displayResume.skills.map((skill, index) => (
                                    <span key={index} className="text-sm bg-gray-100 px-3 py-1 rounded-full print:bg-transparent print:border print:border-gray-300 print:px-2">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="print:hidden">
                <ResumeScore score={resumeScore} skills={resume.skills} />
            </div>
        </div>
    );
}
