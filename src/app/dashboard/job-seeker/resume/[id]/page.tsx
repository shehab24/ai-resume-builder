"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Printer, Edit, Save, X, Plus, Trash2, Upload, Palette, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { ResumeScore } from "@/components/resume-score";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import "./print.css";

interface ResumeSettings {
    layout: 'classic' | 'modern' | 'professional';
    themeColor: string;
    fontSize?: 'small' | 'medium' | 'large';
    fontColor?: string;
    titleSize?: 'small' | 'medium' | 'large';
    sectionTitleSize?: 'small' | 'medium' | 'large';
}

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
    certifications?: Array<{
        name: string;
        issuer: string;
        date: string;
        credentialId?: string;
    }>;
    projects?: Array<{
        name: string;
        description: string;
        technologies: string[];
        link?: string;
        startDate?: string;
        endDate?: string;
    }>;
    languages?: Array<{
        name: string;
        proficiency: string; // e.g., "Native", "Fluent", "Intermediate", "Basic"
    }>;
    awards?: Array<{
        title: string;
        issuer: string;
        date: string;
        description?: string;
    }>;
    settings?: ResumeSettings;
}

const THEME_COLORS = [
    { name: 'Black', value: '#000000' },
    { name: 'Teal', value: '#0d9488' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Blue', value: '#2563eb' },
    { name: 'Green', value: '#16a34a' },
];

const FONT_SIZES = [
    { name: 'Small', value: 'small', label: 'Small (12px)' },
    { name: 'Medium', value: 'medium', label: 'Medium (14px)' },
    { name: 'Large', value: 'large', label: 'Large (16px)' },
];

const NAME_SIZES = [
    { name: 'Small', value: 'small', label: 'Small' },
    { name: 'Medium', value: 'medium', label: 'Medium' },
    { name: 'Large', value: 'large', label: 'Large' },
];

const SECTION_TITLE_SIZES = [
    { name: 'Small', value: 'small', label: 'Small' },
    { name: 'Medium', value: 'medium', label: 'Medium' },
    { name: 'Large', value: 'large', label: 'Large' },
];

const TEXT_COLORS = [
    { name: 'Black', value: '#000000' },
    { name: 'Dark Gray', value: '#374151' },
    { name: 'Navy', value: '#1e3a8a' },
    { name: 'Dark Brown', value: '#451a03' },
];

const CertificationsSection = ({ displayResume, editedResume, isEditing, themeColor, layout, onAdd, onRemove, onUpdate, sectionTitleSizeClass }: { displayResume: ResumeData, editedResume: ResumeData | null, isEditing: boolean, themeColor: string, layout?: string, onAdd: () => void, onRemove: (index: number) => void, onUpdate: (newResume: ResumeData) => void, sectionTitleSizeClass?: string }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className={cn(sectionTitleSizeClass || "text-lg", "font-bold uppercase border-b flex-1", layout === 'modern' ? "border-white/30 text-white" : "")} style={{ borderColor: layout === 'modern' ? undefined : themeColor, color: layout === 'modern' ? undefined : themeColor }}>Certifications</h2>
                {isEditing && editedResume && (
                    <Button size="sm" variant="outline" onClick={onAdd} className={cn("print:hidden ml-4", layout === 'modern' ? "text-black bg-white/90 hover:bg-white" : "")}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                )}
            </div>
            {(!displayResume.certifications || displayResume.certifications.length === 0) ? (
                <p className={cn("text-sm text-muted-foreground italic", layout === 'modern' ? "text-white/60" : "")}>No certifications added yet{isEditing ? '. Click "Add" to create one.' : '. Generate a new resume or edit to add.'}</p>
            ) : (
                <div className="space-y-2">
                    {displayResume.certifications.map((cert, index) => (
                        <div key={index}>
                            {isEditing && editedResume ? (
                                <div className="grid grid-cols-2 gap-2 p-4 border rounded relative bg-white text-black">
                                    <Button size="sm" variant="ghost" className="absolute top-2 right-2 text-red-500" onClick={() => onRemove(index)}><Trash2 className="h-4 w-4" /></Button>
                                    <Input value={cert.name} onChange={(e) => { const newItems = [...(editedResume.certifications || [])]; newItems[index].name = e.target.value; onUpdate({ ...editedResume, certifications: newItems }); }} placeholder="Certification Name" />
                                    <Input value={cert.issuer} onChange={(e) => { const newItems = [...(editedResume.certifications || [])]; newItems[index].issuer = e.target.value; onUpdate({ ...editedResume, certifications: newItems }); }} placeholder="Issuer" />
                                    <Input value={cert.date} onChange={(e) => { const newItems = [...(editedResume.certifications || [])]; newItems[index].date = e.target.value; onUpdate({ ...editedResume, certifications: newItems }); }} placeholder="Date (e.g., 2023)" />
                                    <Input value={cert.credentialId || ""} onChange={(e) => { const newItems = [...(editedResume.certifications || [])]; newItems[index].credentialId = e.target.value; onUpdate({ ...editedResume, certifications: newItems }); }} placeholder="Credential ID (optional)" />
                                </div>
                            ) : (
                                <div className={cn("flex justify-between", layout === 'modern' ? "text-white" : "")}>
                                    <div>
                                        <div className="font-bold">{cert.name}</div>
                                        <div className={cn("", layout === 'modern' ? "opacity-90" : "")}>{cert.issuer}</div>
                                        {cert.credentialId && <div className={cn("text-xs text-muted-foreground", layout === 'modern' ? "text-white/75" : "")}>ID: {cert.credentialId}</div>}
                                    </div>
                                    <div className={cn("text-muted-foreground print:text-black", layout === 'modern' ? "text-white/75" : "")}>{cert.date}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ProjectsSection = ({ displayResume, editedResume, isEditing, themeColor, onAdd, onRemove, onUpdate, sectionTitleSizeClass }: { displayResume: ResumeData, editedResume: ResumeData | null, isEditing: boolean, themeColor: string, onAdd: () => void, onRemove: (index: number) => void, onUpdate: (newResume: ResumeData) => void, sectionTitleSizeClass?: string }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className={cn(sectionTitleSizeClass || "text-lg", "font-bold uppercase border-b flex-1")} style={{ borderColor: themeColor, color: themeColor }}>Projects</h2>
                {isEditing && editedResume && (
                    <Button size="sm" variant="outline" onClick={onAdd} className="print:hidden ml-4">
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                )}
            </div>
            {(!displayResume.projects || displayResume.projects.length === 0) ? (
                <p className="text-sm text-muted-foreground italic">No projects added yet{isEditing ? '. Click "Add" to create one.' : '. Generate a new resume or edit to add.'}</p>
            ) : (
                <div className="space-y-4">
                    {displayResume.projects.map((project, index) => (
                        <div key={index}>
                            {isEditing && editedResume ? (
                                <div className="grid grid-cols-1 gap-2 p-4 border rounded relative">
                                    <Button size="sm" variant="ghost" className="absolute top-2 right-2 text-red-500" onClick={() => onRemove(index)}><Trash2 className="h-4 w-4" /></Button>
                                    <Input value={project.name} onChange={(e) => { const newItems = [...(editedResume.projects || [])]; newItems[index].name = e.target.value; onUpdate({ ...editedResume, projects: newItems }); }} placeholder="Project Name" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input value={project.startDate || ""} onChange={(e) => { const newItems = [...(editedResume.projects || [])]; newItems[index].startDate = e.target.value; onUpdate({ ...editedResume, projects: newItems }); }} placeholder="Start Date" />
                                        <Input value={project.endDate || ""} onChange={(e) => { const newItems = [...(editedResume.projects || [])]; newItems[index].endDate = e.target.value; onUpdate({ ...editedResume, projects: newItems }); }} placeholder="End Date" />
                                    </div>
                                    <Textarea value={project.description} onChange={(e) => { const newItems = [...(editedResume.projects || [])]; newItems[index].description = e.target.value; onUpdate({ ...editedResume, projects: newItems }); }} placeholder="Description" />
                                    <Input value={project.link || ""} onChange={(e) => { const newItems = [...(editedResume.projects || [])]; newItems[index].link = e.target.value; onUpdate({ ...editedResume, projects: newItems }); }} placeholder="Project Link" />
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-bold">{project.name}</h3>
                                        {project.startDate && <span className="text-muted-foreground print:text-black">{project.startDate} - {project.endDate || 'Present'}</span>}
                                    </div>
                                    <p className="mt-1">{project.description}</p>
                                    {project.link && <a href={project.link} className="text-blue-600 hover:underline print:text-black">{project.link}</a>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const LanguagesSection = ({ displayResume, editedResume, isEditing, themeColor, layout, onAdd, onRemove, onUpdate, sectionTitleSizeClass }: { displayResume: ResumeData, editedResume: ResumeData | null, isEditing: boolean, themeColor: string, layout?: string, onAdd: () => void, onRemove: (index: number) => void, onUpdate: (newResume: ResumeData) => void, sectionTitleSizeClass?: string }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className={cn(sectionTitleSizeClass || "text-lg", "font-bold uppercase border-b flex-1", layout === 'modern' ? "border-white/30 text-white" : "")} style={{ borderColor: layout === 'modern' ? undefined : themeColor, color: layout === 'modern' ? undefined : themeColor }}>Languages</h2>
                {isEditing && editedResume && (
                    <Button size="sm" variant="outline" onClick={onAdd} className={cn("print:hidden ml-4", layout === 'modern' ? "text-black bg-white/90 hover:bg-white" : "")}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                )}
            </div>
            {(!displayResume.languages || displayResume.languages.length === 0) ? (
                <p className={cn("text-sm text-muted-foreground italic", layout === 'modern' ? "text-white/60" : "")}>No languages added yet{isEditing ? '. Click "Add" to create one.' : '. Generate a new resume or edit to add.'}</p>
            ) : (
                <div className="space-y-1">
                    {displayResume.languages.map((lang, index) => (
                        <div key={index}>
                            {isEditing && editedResume ? (
                                <div className="grid grid-cols-2 gap-2 p-4 border rounded relative bg-white text-black">
                                    <Button size="sm" variant="ghost" className="absolute top-2 right-2 text-red-500" onClick={() => onRemove(index)}><Trash2 className="h-4 w-4" /></Button>
                                    <Input value={lang.name} onChange={(e) => { const newItems = [...(editedResume.languages || [])]; newItems[index].name = e.target.value; onUpdate({ ...editedResume, languages: newItems }); }} placeholder="Language" />
                                    <Input value={lang.proficiency} onChange={(e) => { const newItems = [...(editedResume.languages || [])]; newItems[index].proficiency = e.target.value; onUpdate({ ...editedResume, languages: newItems }); }} placeholder="Proficiency" />
                                </div>
                            ) : (
                                <div className={cn("flex justify-between", layout === 'modern' ? "text-white" : "")}>
                                    <span className="font-medium">{lang.name}</span>
                                    <span className={cn("text-muted-foreground print:text-black", layout === 'modern' ? "text-white/75" : "")}>{lang.proficiency}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const AwardsSection = ({ displayResume, editedResume, isEditing, themeColor, onAdd, onRemove, onUpdate, sectionTitleSizeClass }: { displayResume: ResumeData, editedResume: ResumeData | null, isEditing: boolean, themeColor: string, onAdd: () => void, onRemove: (index: number) => void, onUpdate: (newResume: ResumeData) => void, sectionTitleSizeClass?: string }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className={cn(sectionTitleSizeClass || "text-lg", "font-bold uppercase border-b flex-1")} style={{ borderColor: themeColor, color: themeColor }}>Awards & Honors</h2>
                {isEditing && editedResume && (
                    <Button size="sm" variant="outline" onClick={onAdd} className="print:hidden ml-4">
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                )}
            </div>
            {(!displayResume.awards || displayResume.awards.length === 0) ? (
                <p className="text-sm text-muted-foreground italic">No awards added yet{isEditing ? '. Click "Add" to create one.' : '. Generate a new resume or edit to add.'}</p>
            ) : (
                <div className="space-y-2">
                    {displayResume.awards.map((award, index) => (
                        <div key={index}>
                            {isEditing && editedResume ? (
                                <div className="grid grid-cols-1 gap-2 p-4 border rounded relative">
                                    <Button size="sm" variant="ghost" className="absolute top-2 right-2 text-red-500" onClick={() => onRemove(index)}><Trash2 className="h-4 w-4" /></Button>
                                    <Input value={award.title} onChange={(e) => { const newItems = [...(editedResume.awards || [])]; newItems[index].title = e.target.value; onUpdate({ ...editedResume, awards: newItems }); }} placeholder="Award Title" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input value={award.issuer} onChange={(e) => { const newItems = [...(editedResume.awards || [])]; newItems[index].issuer = e.target.value; onUpdate({ ...editedResume, awards: newItems }); }} placeholder="Issuer" />
                                        <Input value={award.date} onChange={(e) => { const newItems = [...(editedResume.awards || [])]; newItems[index].date = e.target.value; onUpdate({ ...editedResume, awards: newItems }); }} placeholder="Date" />
                                    </div>
                                    <Textarea value={award.description || ""} onChange={(e) => { const newItems = [...(editedResume.awards || [])]; newItems[index].description = e.target.value; onUpdate({ ...editedResume, awards: newItems }); }} placeholder="Description" />
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-baseline">
                                        <div className="font-bold">{award.title}</div>
                                        <span className="text-muted-foreground print:text-black">{award.date}</span>
                                    </div>
                                    <div className="font-medium" style={{ color: themeColor }}>{award.issuer}</div>
                                    <p className="mt-1">{award.description}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
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

const PersonalInfoSection = ({ displayResume, editedResume, isEditing, themeColor, layout, onUpdate, titleSizeClass }: { displayResume: ResumeData, editedResume: ResumeData | null, isEditing: boolean, themeColor: string, layout: string, onUpdate: (data: ResumeData) => void, titleSizeClass?: string }) => (
    <div className={cn("text-center", layout === 'modern' ? "text-left" : "")}>
        {(isEditing || displayResume.personalInfo.profileImage) && (
            <div className={cn("mb-4 flex flex-col gap-2", layout === 'modern' ? "items-start" : "items-center")}>
                {displayResume.personalInfo.profileImage && (
                    <img
                        src={displayResume.personalInfo.profileImage}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 print:border-gray-400"
                        style={{ borderColor: layout === 'professional' ? themeColor : undefined }}
                    />
                )}
                {isEditing && editedResume && (
                    <div className="w-full max-w-md">
                        <Input
                            value={editedResume.personalInfo.profileImage || ""}
                            onChange={(e) => onUpdate({
                                ...editedResume,
                                personalInfo: { ...editedResume.personalInfo, profileImage: e.target.value }
                            })}
                            placeholder="Image URL"
                            className="text-sm"
                        />
                    </div>
                )}
            </div>
        )}

        {isEditing && editedResume ? (
            <Input
                value={editedResume.personalInfo.fullName}
                onChange={(e) => onUpdate({
                    ...editedResume,
                    personalInfo: { ...editedResume.personalInfo, fullName: e.target.value }
                })}
                className={cn(titleSizeClass || "text-3xl", "font-bold uppercase tracking-wider mb-2 leading-tight", layout === 'modern' ? "text-left" : "text-center")}
                placeholder="Full Name"
            />
        ) : (
            <h1 className={cn(titleSizeClass || "text-3xl", "font-bold uppercase tracking-wider leading-tight")} style={{ color: themeColor }}>{displayResume.personalInfo.fullName}</h1>
        )}

        <div className={cn("flex gap-4 mt-2 text-muted-foreground print:text-black flex-wrap", layout === 'modern' ? "justify-start" : "justify-center")}>
            {isEditing && editedResume ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                    <Input value={editedResume.personalInfo.email} onChange={(e) => onUpdate({ ...editedResume, personalInfo: { ...editedResume.personalInfo, email: e.target.value } })} placeholder="Email" />
                    <Input value={editedResume.personalInfo.phone} onChange={(e) => onUpdate({ ...editedResume, personalInfo: { ...editedResume.personalInfo, phone: e.target.value } })} placeholder="Phone" />
                    <Input value={editedResume.personalInfo.linkedin} onChange={(e) => onUpdate({ ...editedResume, personalInfo: { ...editedResume.personalInfo, linkedin: e.target.value } })} placeholder="LinkedIn" />
                    <Input value={editedResume.personalInfo.portfolio} onChange={(e) => onUpdate({ ...editedResume, personalInfo: { ...editedResume.personalInfo, portfolio: e.target.value } })} placeholder="Portfolio" />
                </div>
            ) : (
                <>
                    <span>{displayResume.personalInfo.email}</span>
                    <span>{displayResume.personalInfo.phone}</span>
                    {displayResume.personalInfo.linkedin && <span>{displayResume.personalInfo.linkedin}</span>}
                    {displayResume.personalInfo.portfolio && <span>{displayResume.personalInfo.portfolio}</span>}
                </>
            )}
        </div>
    </div>
);

const SummarySection = ({ displayResume, editedResume, isEditing, themeColor, onUpdate, sectionTitleSizeClass }: { displayResume: ResumeData, editedResume: ResumeData | null, isEditing: boolean, themeColor: string, onUpdate: (data: ResumeData) => void, sectionTitleSizeClass?: string }) => {
    return (
        <div className="relative group">
            <h2 className={cn(sectionTitleSizeClass || "text-lg", "font-bold uppercase border-b mb-2")} style={{ borderColor: themeColor, color: themeColor }}>Professional Summary</h2>
            {isEditing && editedResume ? (
                <div className="space-y-2">
                    <Textarea
                        value={editedResume.summary}
                        onChange={(e) => onUpdate({ ...editedResume, summary: e.target.value })}
                        className="text-sm leading-relaxed min-h-[100px]"
                        placeholder="Summary..."
                    />
                </div>
            ) : (
                <p className="leading-relaxed">{displayResume.summary}</p>
            )}
        </div>
    );
};

const ExperienceSection = ({ displayResume, editedResume, isEditing, themeColor, onUpdate, onAdd, onRemove, sectionTitleSizeClass }: { displayResume: ResumeData, editedResume: ResumeData | null, isEditing: boolean, themeColor: string, onUpdate: (data: ResumeData) => void, onAdd: () => void, onRemove: (index: number) => void, sectionTitleSizeClass?: string }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className={cn(sectionTitleSizeClass || "text-lg", "font-bold uppercase border-b flex-1")} style={{ borderColor: themeColor, color: themeColor }}>Experience</h2>
                {isEditing && editedResume && (
                    <Button size="sm" variant="outline" onClick={onAdd} className="print:hidden ml-4">
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                )}
            </div>
            <div className="space-y-4">
                {displayResume.experience.map((exp, index) => (
                    <div key={index} className="relative">
                        {isEditing && editedResume ? (
                            <div className="space-y-2 p-4 border rounded relative">
                                <Button size="sm" variant="ghost" className="absolute top-2 right-2 text-red-500" onClick={() => onRemove(index)}><Trash2 className="h-4 w-4" /></Button>
                                <Input value={exp.title} onChange={(e) => { const newExp = [...editedResume.experience]; newExp[index].title = e.target.value; onUpdate({ ...editedResume, experience: newExp }); }} placeholder="Job Title" />
                                <Input value={exp.company} onChange={(e) => { const newExp = [...editedResume.experience]; newExp[index].company = e.target.value; onUpdate({ ...editedResume, experience: newExp }); }} placeholder="Company" />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input value={exp.startDate} onChange={(e) => { const newExp = [...editedResume.experience]; newExp[index].startDate = e.target.value; onUpdate({ ...editedResume, experience: newExp }); }} placeholder="Start Date" />
                                    <Input value={exp.endDate} onChange={(e) => { const newExp = [...editedResume.experience]; newExp[index].endDate = e.target.value; onUpdate({ ...editedResume, experience: newExp }); }} placeholder="End Date" />
                                </div>
                                <Textarea value={exp.description} onChange={(e) => { const newExp = [...editedResume.experience]; newExp[index].description = e.target.value; onUpdate({ ...editedResume, experience: newExp }); }} placeholder="Description" />
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-bold">{exp.title}</h3>
                                    <span className="text-muted-foreground print:text-black">{exp.startDate} - {exp.endDate}</span>
                                </div>
                                <div className="font-medium" style={{ color: themeColor }}>{exp.company}</div>
                                <p className="mt-1 whitespace-pre-line">{exp.description}</p>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const EducationSection = ({ displayResume, editedResume, isEditing, themeColor, layout, onUpdate, onAdd, onRemove, sectionTitleSizeClass }: { displayResume: ResumeData, editedResume: ResumeData | null, isEditing: boolean, themeColor: string, layout?: string, onUpdate: (data: ResumeData) => void, onAdd: () => void, onRemove: (index: number) => void, sectionTitleSizeClass?: string }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className={cn(sectionTitleSizeClass || "text-lg", "font-bold uppercase border-b flex-1", layout === 'modern' ? "border-white/30 text-white" : "")} style={{ borderColor: layout === 'modern' ? undefined : themeColor, color: layout === 'modern' ? undefined : themeColor }}>Education</h2>
                {isEditing && editedResume && (
                    <Button size="sm" variant="outline" onClick={onAdd} className={cn("print:hidden ml-4", layout === 'modern' ? "text-black bg-white/90 hover:bg-white" : "")}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                )}
            </div>
            <div className="space-y-2">
                {displayResume.education.map((edu, index) => (
                    <div key={index}>
                        {isEditing && editedResume ? (
                            <div className="grid grid-cols-3 gap-2 p-4 border rounded relative bg-white text-black">
                                <Button size="sm" variant="ghost" className="absolute top-2 right-2 text-red-500" onClick={() => onRemove(index)}><Trash2 className="h-4 w-4" /></Button>
                                <Input value={edu.school} onChange={(e) => { const newEdu = [...editedResume.education]; newEdu[index].school = e.target.value; onUpdate({ ...editedResume, education: newEdu }); }} placeholder="School" />
                                <Input value={edu.degree} onChange={(e) => { const newEdu = [...editedResume.education]; newEdu[index].degree = e.target.value; onUpdate({ ...editedResume, education: newEdu }); }} placeholder="Degree" />
                                <Input value={edu.graduationDate} onChange={(e) => { const newEdu = [...editedResume.education]; newEdu[index].graduationDate = e.target.value; onUpdate({ ...editedResume, education: newEdu }); }} placeholder="Year" />
                            </div>
                        ) : (
                            <div className={cn("flex justify-between", layout === 'modern' ? "text-white" : "")}>
                                <div>
                                    <div className="font-bold">{edu.school}</div>
                                    <div className={cn("", layout === 'modern' ? "opacity-90" : "")}>{edu.degree}</div>
                                </div>
                                <div className={cn("text-muted-foreground print:text-black", layout === 'modern' ? "text-white/75" : "")}>{edu.graduationDate}</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const SkillsSection = ({ displayResume, editedResume, isEditing, themeColor, layout, onUpdate, sectionTitleSizeClass }: { displayResume: ResumeData, editedResume: ResumeData | null, isEditing: boolean, themeColor: string, layout: string, onUpdate: (data: ResumeData) => void, sectionTitleSizeClass?: string }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h2 className={cn(sectionTitleSizeClass || "text-lg", "font-bold uppercase border-b flex-1", layout === 'modern' ? "border-white/30 text-white" : "")} style={{ borderColor: layout === 'modern' ? undefined : themeColor, color: layout === 'modern' ? undefined : themeColor }}>Skills</h2>
            </div>
            {isEditing && editedResume ? (
                <Textarea
                    value={editedResume.skills.join(", ")}
                    onChange={(e) => onUpdate({
                        ...editedResume,
                        skills: e.target.value.split(",").map(s => s.trim()).filter(s => s)
                    })}
                    placeholder="Skills (comma separated)"
                    className="min-h-[60px] text-black"
                />
            ) : (
                <div className="flex flex-wrap gap-2">
                    {displayResume.skills.map((skill, index) => (
                        <span key={index} className={cn("px-3 py-1 rounded-full print:border print:px-2", layout === 'modern' ? "bg-white/20 text-white" : "")} style={{ backgroundColor: layout === 'modern' ? undefined : '#f3f4f6', color: layout === 'modern' ? undefined : 'inherit' }}>
                            {skill}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function ResumeViewPage() {
    const params = useParams();
    const [resume, setResume] = useState<ResumeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDesignOpen, setIsDesignOpen] = useState(false);
    const [editedResume, setEditedResume] = useState<ResumeData | null>(null);
    const [resumeScore, setResumeScore] = useState(0);

    useEffect(() => {
        const fetchResume = async () => {
            try {
                const response = await fetch(`/api/resume/${params.id}`);
                if (!response.ok) throw new Error("Failed to fetch resume");
                const data = await response.json();
                const parsedResume = JSON.parse(data.content);

                // Ensure settings exist
                if (!parsedResume.settings) {
                    parsedResume.settings = { layout: 'classic', themeColor: '#000000' };
                }

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

    const updateSettings = (key: keyof ResumeSettings, value: string) => {
        if (!editedResume) return;
        const newSettings = { ...editedResume.settings!, [key]: value };
        const newResume = { ...editedResume, settings: newSettings };
        setEditedResume(newResume);

        // Auto-save settings changes if not in edit mode
        if (!isEditing) {
            setResume(newResume);
            // Optional: trigger save to backend immediately for settings
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

    // Certifications handlers
    const addCertification = () => {
        if (!editedResume) return;
        setEditedResume({
            ...editedResume,
            certifications: [
                ...(editedResume.certifications || []),
                { name: "", issuer: "", date: "", credentialId: "" }
            ]
        });
    };

    const removeCertification = (index: number) => {
        if (!editedResume) return;
        setEditedResume({
            ...editedResume,
            certifications: (editedResume.certifications || []).filter((_, i) => i !== index)
        });
    };

    // Projects handlers
    const addProject = () => {
        if (!editedResume) return;
        setEditedResume({
            ...editedResume,
            projects: [
                ...(editedResume.projects || []),
                { name: "", description: "", technologies: [], link: "", startDate: "", endDate: "" }
            ]
        });
    };

    const removeProject = (index: number) => {
        if (!editedResume) return;
        setEditedResume({
            ...editedResume,
            projects: (editedResume.projects || []).filter((_, i) => i !== index)
        });
    };

    // Languages handlers
    const addLanguage = () => {
        if (!editedResume) return;
        setEditedResume({
            ...editedResume,
            languages: [
                ...(editedResume.languages || []),
                { name: "", proficiency: "" }
            ]
        });
    };

    const removeLanguage = (index: number) => {
        if (!editedResume) return;
        setEditedResume({
            ...editedResume,
            languages: (editedResume.languages || []).filter((_, i) => i !== index)
        });
    };

    // Awards handlers
    const addAward = () => {
        if (!editedResume) return;
        setEditedResume({
            ...editedResume,
            awards: [
                ...(editedResume.awards || []),
                { title: "", issuer: "", date: "", description: "" }
            ]
        });
    };

    const removeAward = (index: number) => {
        if (!editedResume) return;
        setEditedResume({
            ...editedResume,
            awards: (editedResume.awards || []).filter((_, i) => i !== index)
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
    const { layout, themeColor, fontSize, fontColor, titleSize, sectionTitleSize } = displayResume.settings || { layout: 'classic', themeColor: '#000000', fontSize: 'medium', fontColor: '#000000', titleSize: 'medium', sectionTitleSize: 'medium' };

    const titleSizeClass = layout === 'modern'
        ? (titleSize === 'small' ? 'text-lg' : titleSize === 'large' ? 'text-2xl' : 'text-xl')
        : (titleSize === 'small' ? 'text-2xl' : titleSize === 'large' ? 'text-4xl' : 'text-3xl');
    const sectionTitleSizeClass = sectionTitleSize === 'small' ? 'text-base' : sectionTitleSize === 'large' ? 'text-xl' : 'text-lg';

    // --- Layout Components ---

    const fontSizeClass = fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm';
    const globalStyle = { color: fontColor || 'inherit' };

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-8 print:p-0 print:space-y-0">

            <div className="flex justify-between items-center print:hidden">
                <h1 className="text-2xl font-bold">Resume Preview</h1>
                <div className="flex gap-2">
                    {/* Design Customization Trigger */}
                    <Sheet open={isDesignOpen} onOpenChange={setIsDesignOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline">
                                <Palette className="mr-2 h-4 w-4" />
                                Design
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>Customize Resume</SheetTitle>
                                <SheetDescription>
                                    Change the layout, font, and color theme of your resume.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="py-6 space-y-6">
                                <div className="space-y-3">
                                    <Label>Layout Style</Label>
                                    <RadioGroup
                                        value={layout}
                                        onValueChange={(val) => updateSettings('layout', val)}
                                        className="grid grid-cols-1 gap-2"
                                    >
                                        <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent cursor-pointer">
                                            <RadioGroupItem value="classic" id="classic" />
                                            <Label htmlFor="classic" className="flex items-center gap-2 cursor-pointer"><LayoutTemplate className="h-4 w-4" /> Classic</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent cursor-pointer">
                                            <RadioGroupItem value="modern" id="modern" />
                                            <Label htmlFor="modern" className="flex items-center gap-2 cursor-pointer"><LayoutTemplate className="h-4 w-4" /> Modern (Sidebar)</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent cursor-pointer">
                                            <RadioGroupItem value="professional" id="professional" />
                                            <Label htmlFor="professional" className="flex items-center gap-2 cursor-pointer"><LayoutTemplate className="h-4 w-4" /> Professional</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="space-y-3">
                                    <Label>Theme Color</Label>
                                    <div className="grid grid-cols-7 gap-2">
                                        {THEME_COLORS.map((color) => (
                                            <button
                                                key={color.name}
                                                onClick={() => updateSettings('themeColor', color.value)}
                                                className={cn(
                                                    "w-8 h-8 rounded-full border-2 transition-all",
                                                    themeColor === color.value ? "border-black scale-110" : "border-transparent"
                                                )}
                                                style={{ backgroundColor: color.value }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label>Font Size</Label>
                                    <RadioGroup
                                        value={fontSize || 'medium'}
                                        onValueChange={(val) => updateSettings('fontSize', val)}
                                        className="grid grid-cols-3 gap-2"
                                    >
                                        {FONT_SIZES.map((size) => (
                                            <div key={size.value} className="flex items-center space-x-2 border p-2 rounded-md hover:bg-accent cursor-pointer">
                                                <RadioGroupItem value={size.value} id={`font-${size.value}`} />
                                                <Label htmlFor={`font-${size.value}`} className="cursor-pointer text-xs">{size.name}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                <div className="space-y-3">
                                    <Label>Name Size</Label>
                                    <RadioGroup
                                        value={titleSize || 'medium'}
                                        onValueChange={(val) => updateSettings('titleSize', val)}
                                        className="grid grid-cols-3 gap-2"
                                    >
                                        {NAME_SIZES.map((size) => (
                                            <div key={size.value} className="flex items-center space-x-2 border p-2 rounded-md hover:bg-accent cursor-pointer">
                                                <RadioGroupItem value={size.value} id={`name-${size.value}`} />
                                                <Label htmlFor={`name-${size.value}`} className="cursor-pointer text-xs">{size.name}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                <div className="space-y-3">
                                    <Label>Section Title Size</Label>
                                    <RadioGroup
                                        value={sectionTitleSize || 'medium'}
                                        onValueChange={(val) => updateSettings('sectionTitleSize', val)}
                                        className="grid grid-cols-3 gap-2"
                                    >
                                        {SECTION_TITLE_SIZES.map((size) => (
                                            <div key={size.value} className="flex items-center space-x-2 border p-2 rounded-md hover:bg-accent cursor-pointer">
                                                <RadioGroupItem value={size.value} id={`section-${size.value}`} />
                                                <Label htmlFor={`section-${size.value}`} className="cursor-pointer text-xs">{size.name}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                <div className="space-y-3">
                                    <Label>Text Color</Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {TEXT_COLORS.map((color) => (
                                            <button
                                                key={color.name}
                                                onClick={() => updateSettings('fontColor', color.value)}
                                                className={cn(
                                                    "w-8 h-8 rounded-full border-2 transition-all",
                                                    (fontColor || '#000000') === color.value ? "border-black scale-110" : "border-transparent"
                                                )}
                                                style={{ backgroundColor: color.value }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <Button onClick={async () => { await handleSave(); setIsDesignOpen(false); }} className="w-full" disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>

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

            <Card id="resume-card" className="print:shadow-none print:border-none overflow-hidden">
                <CardContent className="p-0">
                    {/* --- CLASSIC LAYOUT --- */}
                    {layout === 'classic' && (
                        <div className={cn("p-8 space-y-6 print:px-8 print:py-0 print:space-y-4", fontSizeClass)} style={globalStyle}>
                            <div className="border-b pb-6">
                                <PersonalInfoSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} layout={layout} onUpdate={setEditedResume} titleSizeClass={titleSizeClass} />
                            </div>
                            <SummarySection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />
                            <ExperienceSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} onUpdate={setEditedResume} onAdd={addExperience} onRemove={removeExperience} sectionTitleSizeClass={sectionTitleSizeClass} />
                            <div className={(!displayResume.projects || displayResume.projects.length === 0) ? "print:hidden" : ""}>
                                <ProjectsSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} onAdd={addProject} onRemove={removeProject} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />
                            </div>
                            <EducationSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} layout={layout} onUpdate={setEditedResume} onAdd={addEducation} onRemove={removeEducation} sectionTitleSizeClass={sectionTitleSizeClass} />
                            <div className={(!displayResume.certifications || displayResume.certifications.length === 0) ? "print:hidden" : ""}>
                                <CertificationsSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} onAdd={addCertification} onRemove={removeCertification} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />
                            </div>
                            <SkillsSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} layout={layout} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />
                            <div className={(!displayResume.languages || displayResume.languages.length === 0) ? "print:hidden" : ""}>
                                <LanguagesSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} onAdd={addLanguage} onRemove={removeLanguage} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />
                            </div>
                            <div className={(!displayResume.awards || displayResume.awards.length === 0) ? "print:hidden" : ""}>
                                <AwardsSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} onAdd={addAward} onRemove={removeAward} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />
                            </div>
                        </div>
                    )}

                    {/* --- MODERN LAYOUT (Sidebar) --- */}
                    {layout === 'modern' && (
                        <div className={cn("flex min-h-[1000px] print:min-h-screen", fontSizeClass)}>
                            {/* Sidebar */}
                            <div className="w-1/3 p-6 text-white space-y-4 print:min-h-screen" style={{ backgroundColor: themeColor }}>
                                <div className="text-center">
                                    {displayResume.personalInfo.profileImage && (
                                        <img
                                            src={displayResume.personalInfo.profileImage}
                                            alt="Profile"
                                            className="w-32 h-32 rounded-full object-cover border-4 border-white mx-auto mb-4"
                                        />
                                    )}
                                    <h1 className={cn(titleSizeClass || "text-2xl", "font-bold uppercase leading-tight")}>{displayResume.personalInfo.fullName}</h1>
                                    <div className="text-sm mt-2 opacity-90 space-y-1">
                                        <div className="block">{displayResume.personalInfo.email}</div>
                                        <div className="block">{displayResume.personalInfo.phone}</div>
                                        <div className="block">{displayResume.personalInfo.linkedin}</div>
                                        <div className="block">{displayResume.personalInfo.portfolio}</div>
                                    </div>
                                </div>

                                <SkillsSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} layout={layout} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />

                                <EducationSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} layout={layout} onUpdate={setEditedResume} onAdd={addEducation} onRemove={removeEducation} sectionTitleSizeClass={sectionTitleSizeClass} />
                                <div className={(!displayResume.certifications || displayResume.certifications.length === 0) ? "print:hidden" : ""}>
                                    <CertificationsSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} layout={layout} onAdd={addCertification} onRemove={removeCertification} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />
                                </div>
                                <div className={(!displayResume.languages || displayResume.languages.length === 0) ? "print:hidden" : ""}>
                                    <LanguagesSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} layout={layout} onAdd={addLanguage} onRemove={removeLanguage} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="w-2/3 p-8 space-y-6 bg-white" style={globalStyle}>
                                <SummarySection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />

                                <ExperienceSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} onUpdate={setEditedResume} onAdd={addExperience} onRemove={removeExperience} sectionTitleSizeClass={sectionTitleSizeClass} />
                                <div className={(!displayResume.projects || displayResume.projects.length === 0) ? "print:hidden" : ""}>
                                    <ProjectsSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} onAdd={addProject} onRemove={removeProject} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />
                                </div>
                                <div className={(!displayResume.awards || displayResume.awards.length === 0) ? "print:hidden" : ""}>
                                    <AwardsSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} onAdd={addAward} onRemove={removeAward} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- PROFESSIONAL LAYOUT --- */}
                    {layout === 'professional' && (
                        <div className={fontSizeClass}>
                            {/* Header Banner */}
                            <div className="p-8 text-white" style={{ backgroundColor: themeColor }}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h1 className={cn(titleSizeClass || "text-4xl", "font-bold uppercase tracking-wider mb-2 leading-tight")}>{displayResume.personalInfo.fullName}</h1>
                                        <p className="text-lg opacity-90">Professional</p>
                                    </div>
                                    {displayResume.personalInfo.profileImage && (
                                        <img
                                            src={displayResume.personalInfo.profileImage}
                                            alt="Profile"
                                            className="w-24 h-24 rounded-full object-cover border-4 border-white"
                                        />
                                    )}
                                </div>
                                <div className="flex gap-4 mt-4 text-sm opacity-90 flex-wrap">
                                    <span>{displayResume.personalInfo.email}</span>
                                    <span>|</span>
                                    <span>{displayResume.personalInfo.phone}</span>
                                    {displayResume.personalInfo.linkedin && (
                                        <><span>|</span><span>{displayResume.personalInfo.linkedin}</span></>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 space-y-6" style={globalStyle}>
                                <SummarySection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />
                                <div className="grid grid-cols-6 gap-8">
                                    <div className="col-span-4 space-y-6">
                                        <ExperienceSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} onUpdate={setEditedResume} onAdd={addExperience} onRemove={removeExperience} sectionTitleSizeClass={sectionTitleSizeClass} />
                                        <div className={(!displayResume.projects || displayResume.projects.length === 0) ? "print:hidden" : ""}>
                                            <ProjectsSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} onAdd={addProject} onRemove={removeProject} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />
                                        </div>
                                        <div className={(!displayResume.awards || displayResume.awards.length === 0) ? "print:hidden" : ""}>
                                            <AwardsSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} onAdd={addAward} onRemove={removeAward} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />
                                        </div>
                                    </div>
                                    <div className="col-span-2 space-y-6">
                                        <SkillsSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} layout={layout} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />
                                        <EducationSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} layout={layout} onUpdate={setEditedResume} onAdd={addEducation} onRemove={removeEducation} sectionTitleSizeClass={sectionTitleSizeClass} />
                                        <div className={(!displayResume.certifications || displayResume.certifications.length === 0) ? "print:hidden" : ""}>
                                            <CertificationsSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} layout={layout} onAdd={addCertification} onRemove={removeCertification} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />
                                        </div>
                                        <div className={(!displayResume.languages || displayResume.languages.length === 0) ? "print:hidden" : ""}>
                                            <LanguagesSection displayResume={displayResume} editedResume={editedResume} isEditing={isEditing} themeColor={themeColor} layout={layout} onAdd={addLanguage} onRemove={removeLanguage} onUpdate={setEditedResume} sectionTitleSizeClass={sectionTitleSizeClass} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="print:hidden">
                <ResumeScore score={resumeScore} skills={resume.skills} />
            </div>
        </div>
    );
}
