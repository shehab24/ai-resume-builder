"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Loader2, MapPin, DollarSign, CheckCircle, Briefcase, Clock, Building,
    Calendar, Zap, ExternalLink, FileText, AlertCircle, Users, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Job {
    id: string;
    title: string;
    description: string;
    location: string;
    salary?: string;
    requirements: string[];
    recruiter: { name: string };
    recruiterId: string;
    jobType?: string;
    workMode?: string;
    experienceLevel?: string;
    benefits?: string[];
    applicationDeadline?: string;
    tasks?: string[];
    company?: string;
    hasApplied?: boolean;
    isExternal?: boolean;
    externalUrl?: string;
    applicationMethod?: string;
    applicationEmail?: string;
    isOwnJob?: boolean;
}

interface Resume {
    id: string;
    title: string;
    isDefault: boolean;
}

const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    .jd-wrap { font-family: 'Inter', sans-serif; max-width: 1100px; margin: 0 auto; padding-bottom: 80px; }
    
    /* Back link */
    .jd-back {
        display: inline-flex; align-items: center; gap: 8px; font-size: 14px;
        color: #64748b; font-weight: 500; margin-bottom: 24px; text-decoration: none;
        transition: color 150ms; cursor: pointer; background: transparent; border: none;
    }
    .jd-back:hover { color: #003a9b; }

    /* Layout Grid */
    .jd-grid {
        display: flex; align-items: flex-start; gap: 32px;
    }
    .jd-main { flex: 1; min-width: 0; }
    .jd-sidebar { width: 340px; flex-shrink: 0; position: sticky; top: 24px; }

    /* Main Card */
    .jd-card {
        background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
        overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }
    .jd-card-header {
        padding: 32px 32px 24px; border-bottom: 1px solid #f1f5f9;
        background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
        position: relative;
    }
    .jd-card-header::before {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
        background: linear-gradient(90deg, #003a9b, #3b82f6);
    }
    .jd-company-row {
        display: flex; align-items: center; gap: 8px; font-size: 14px;
        color: #64748b; font-weight: 600; margin-bottom: 12px;
    }
    .jd-company-icon {
        width: 24px; height: 24px; background: #eef2ff; color: #003a9b;
        border-radius: 6px; display: flex; align-items: center; justify-content: center;
    }
    .jd-title {
        font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;
        line-height: 1.2; margin-bottom: 20px;
    }

    /* Meta stats */
    .jd-meta-grid {
        display: flex; flex-wrap: wrap; gap: 12px;
    }
    .jd-meta-item {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 500;
        background: #f1f5f9; color: #475569;
    }
    .jd-meta-item.highlight { background: #f0fdf4; color: #16a34a; }
    .jd-meta-item.blue      { background: #eff6ff; color: #1d4ed8; }
    .jd-meta-item.orange    { background: #fff7ed; color: #ea580c; }
    .jd-meta-item.purple    { background: #faf5ff; color: #7c3aed; }

    /* Content sections */
    .jd-section { padding: 32px; border-bottom: 1px solid #f1f5f9; }
    .jd-section:last-child { border-bottom: none; }
    .jd-section-title {
        font-size: 18px; font-weight: 700; color: #0f172a;
        margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
    }
    .jd-section-title svg { color: #003a9b; }
    
    .jd-desc {
        font-size: 15px; color: #475569; line-height: 1.7; white-space: pre-wrap;
    }

    /* Lists */
    .jd-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
    .jd-list-item {
        display: flex; align-items: flex-start; gap: 12px;
        font-size: 15px; color: #475569; line-height: 1.6;
    }
    .jd-list-bullet {
        margin-top: 8px; width: 6px; height: 6px; border-radius: 50%;
        background: #003a9b; flex-shrink: 0;
    }

    /* Benefits grid */
    .jd-benefits { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
    .jd-benefit {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 16px; background: #f8fafc; border: 1px solid #f1f5f9;
        border-radius: 10px; font-size: 14px; font-weight: 500; color: #334155;
    }
    .jd-benefit svg { color: #22c55e; flex-shrink: 0; }

    /* Sidebar box */
    .jd-sidebox {
        background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
        padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        display: flex; flex-direction: column; gap: 20px;
    }
    .jd-btn {
        width: 100%; padding: 14px; border-radius: 10px; border: none;
        font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        cursor: pointer; transition: all 150ms;
    }
    .jd-btn.primary { background: #003a9b; color: #fff; box-shadow: 0 4px 12px rgba(0,58,155,0.2); }
    .jd-btn.primary:hover:not(:disabled) { background: #002d7a; transform: translateY(-1px); }
    .jd-btn.purple  { background: #7c3aed; color: #fff; box-shadow: 0 4px 12px rgba(124,58,237,0.2); }
    .jd-btn.purple:hover { background: #6d28d9; }
    .jd-btn.outline { background: #fff; color: #003a9b; border: 1.5px solid #003a9b; }
    .jd-btn.outline:hover { background: #eef2ff; }
    .jd-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
    .jd-btn.applied { background: #22c55e; color: #fff; cursor: default; }

    .jd-deadline {
        text-align: center; font-size: 13px; color: #64748b; font-weight: 500;
        display: flex; align-items: center; justify-content: center; gap: 6px;
    }

    /* Select input */
    .jd-select {
        width: 100%; padding: 12px 14px; border: 1.5px solid #e2e8f0;
        border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 14px;
        color: #1e293b; background: #fff; outline: none; transition: border-color 150ms;
        cursor: pointer;
    }
    .jd-select:focus { border-color: #003a9b; }

    @media (max-width: 900px) {
        .jd-grid { flex-direction: column; }
        .jd-sidebar { width: 100%; position: static; }
        .jd-card-header { padding: 24px; }
        .jd-section { padding: 24px; }
    }
`;

export default function JobDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [selectedResumeId, setSelectedResumeId] = useState<string>("");
    
    // Dialogs
    const [showApplyDialog, setShowApplyDialog] = useState(false);
    const [showNoResumeDialog, setShowNoResumeDialog] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await fetch(`/api/jobs/${params.id}`);
                if (!response.ok) throw new Error();
                setJob(await response.json());
            } catch {
                toast.error("Failed to load job details");
            } finally {
                setLoading(false);
            }
        };

        const fetchResumes = async () => {
            try {
                const res = await fetch("/api/resumes");
                if (res.ok) {
                    const data = await res.json();
                    setResumes(data.resumes || []);
                    // Auto-select the default resume if one exists
                    if (data.resumes && data.resumes.length > 0) {
                        const defaultRes = data.resumes.find((r: Resume) => r.isDefault);
                        if (defaultRes) {
                            setSelectedResumeId(defaultRes.id);
                        } else {
                            setSelectedResumeId(data.resumes[0].id);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching resumes:", error);
            }
        };

        if (params.id) {
            fetchJob();
            fetchResumes();
        }
    }, [params.id]);

    const handleApplyClick = () => {
        if (!job) return;

        if (job.isExternal) {
            if (job.applicationMethod === "EMAIL" && job.applicationEmail) {
                window.location.href = `mailto:${job.applicationEmail}?subject=Application for ${job.title}`;
                return;
            }
            if (job.applicationMethod === "EXTERNAL_LINK" && job.externalUrl) {
                window.open(job.externalUrl, "_blank");
                return;
            }
        }

        if (resumes.length === 0) {
            setShowNoResumeDialog(true);
        } else {
            setShowApplyDialog(true);
        }
    };

    const submitApplication = async () => {
        if (!selectedResumeId) {
            toast.error("Please select a resume");
            return;
        }

        setApplying(true);
        try {
            const res = await fetch("/api/applications/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId: params.id, resumeId: selectedResumeId }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to submit application");
            }

            const data = await res.json();
            setJob(prev => prev ? { ...prev, hasApplied: true } : prev);
            setShowApplyDialog(false);
            toast.success("Application submitted successfully!");

            if (data.tasks && data.tasks.length > 0) {
                toast.info("This job has required tasks to complete!", { duration: 5000 });
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to submit application.");
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <div className="jd-wrap" style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="jd-wrap" style={{ textAlign: 'center', paddingTop: 100 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Job not found</h3>
                <button className="jd-back" onClick={() => router.back()}>
                    <ArrowLeft size={16} /> Go back
                </button>
            </div>
        );
    }

    const companyName = job.company || job.recruiter?.name || "TalentFlow";

    return (
        <div className="jd-wrap">
            <style dangerouslySetInnerHTML={{ __html: css }} />
            
            <button className="jd-back" onClick={() => router.back()}>
                <ArrowLeft size={16} /> Back to Jobs
            </button>

            <div className="jd-grid">
                {/* ── Main Content Column ── */}
                <div className="jd-main">
                    <div className="jd-card">
                        
                        {/* Header Details */}
                        <div className="jd-card-header">
                            <div className="jd-company-row">
                                <div className="jd-company-icon">
                                    <Building size={14} />
                                </div>
                                {companyName}
                            </div>
                            
                            <h1 className="jd-title">{job.title}</h1>
                            
                            <div className="jd-meta-grid">
                                {job.location && (
                                    <span className="jd-meta-item">
                                        <MapPin size={14} /> {job.location}
                                    </span>
                                )}
                                {job.salary && (
                                    <span className="jd-meta-item highlight">
                                        <DollarSign size={14} /> {job.salary}
                                    </span>
                                )}
                                {job.jobType && (
                                    <span className="jd-meta-item orange">
                                        <Briefcase size={14} /> {job.jobType}
                                    </span>
                                )}
                                {job.workMode && (
                                    <span className="jd-meta-item blue">
                                        <MapPin size={14} /> {job.workMode}
                                    </span>
                                )}
                                {job.isExternal && (
                                    <span className="jd-meta-item purple">
                                        <ExternalLink size={14} /> External Posting
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* About Role */}
                        <div className="jd-section">
                            <h3 className="jd-section-title">
                                <FileText size={18} /> About the Role
                            </h3>
                            <div className="jd-desc">{job.description}</div>
                        </div>

                        {/* Requirements */}
                        {job.requirements && job.requirements.length > 0 && (
                            <div className="jd-section">
                                <h3 className="jd-section-title">
                                    <CheckCircle size={18} /> Requirements & Skills
                                </h3>
                                <ul className="jd-list">
                                    {job.requirements.map((req, idx) => (
                                        <li key={idx} className="jd-list-item">
                                            <div className="jd-list-bullet" />
                                            <span>{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Benefits */}
                        {job.benefits && job.benefits.length > 0 && (
                            <div className="jd-section">
                                <h3 className="jd-section-title">
                                    <Zap size={18} /> Benefits & Perks
                                </h3>
                                <div className="jd-benefits">
                                    {job.benefits.map((benefit, idx) => (
                                        <div key={idx} className="jd-benefit">
                                            <CheckCircle size={16} />
                                            {benefit}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Sidebar Column ── */}
                <div className="jd-sidebar">
                    <div className="jd-sidebox">
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                            Ready to apply?
                        </h3>
                        
                        {job.isOwnJob ? (
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                                    You posted this job. Switching to recruiter view lets you see applicants.
                                </p>
                                <button
                                    className="jd-btn outline"
                                    onClick={() => router.push(`/dashboard/recruiter/jobs/${job.id}/applications`)}
                                >
                                    <Users size={16} /> View Requirements
                                </button>
                            </div>
                        ) : job.hasApplied ? (
                            <button className="jd-btn applied" disabled>
                                <CheckCircle size={18} /> Applied Successfully
                            </button>
                        ) : job.isExternal ? (
                            <button className="jd-btn purple" onClick={handleApplyClick}>
                                <ExternalLink size={18} /> Apply on Company Site
                            </button>
                        ) : (
                            <button className="jd-btn primary" onClick={handleApplyClick}>
                                <Zap size={18} fill="currentColor" /> Quick Apply Now
                            </button>
                        )}

                        {job.applicationDeadline && (
                            <div className="jd-deadline">
                                <Clock size={14} />
                                Apply before {new Date(job.applicationDeadline).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Dialog: Select Resume ── */}
            <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Application</DialogTitle>
                        <DialogDescription>
                            You are applying for <strong>{job.title}</strong> at {companyName}.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div style={{ padding: '20px 0' }}>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
                            Select the resume to send:
                        </label>
                        <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                            <SelectTrigger style={{ width: '100%', height: 48, borderRadius: 10, fontSize: 14 }}>
                                <SelectValue placeholder="Select a resume" />
                            </SelectTrigger>
                            <SelectContent style={{ borderRadius: 10 }}>
                                {resumes.map(r => (
                                    <SelectItem key={r.id} value={r.id} style={{ cursor: 'pointer', padding: '12px', fontSize: 14 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FileText size={16} color={r.isDefault ? "#003a9b" : "#64748b"} />
                                            <span style={{ fontWeight: 500, color: '#0f172a' }}>{r.title}</span>
                                            {r.isDefault && (
                                                <span style={{ 
                                                    background: '#eef2ff', color: '#003a9b', 
                                                    padding: '2px 6px', borderRadius: 4, 
                                                    fontSize: 11, fontWeight: 600, marginLeft: 6
                                                }}>
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p style={{ marginTop: 12, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                            Your selected resume's snapshot will be securely sent to the recruiter. Make sure it highlights the right skills!
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApplyDialog(false)} disabled={applying}>
                            Cancel
                        </Button>
                        <Button onClick={submitApplication} disabled={applying || !selectedResumeId} style={{ background: '#003a9b' }}>
                            {applying ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                            ) : (
                                "Send Application"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: No Resume Found ── */}
            <Dialog open={showNoResumeDialog} onOpenChange={setShowNoResumeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                            No Resume Found
                        </DialogTitle>
                        <DialogDescription>
                            You need a generated resume to apply for internal platform jobs.
                            Please create one using our AI Resume Builder first!
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNoResumeDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => router.push("/dashboard/job-seeker/resume/create")} style={{ background: '#003a9b' }}>
                            <FileText className="mr-2 h-4 w-4" /> Create Resume
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
