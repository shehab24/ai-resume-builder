"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Briefcase, MapPin, Calendar, CheckCircle, ExternalLink, FileCode, Link as LinkIcon, Trash2, Building, Zap, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Application {
    id: string;
    status: string;
    createdAt: string;
    taskSubmissions: string[];
    job: {
        id: string;
        title: string;
        company: string;
        location: string;
        tasks: string[];
    };
}

const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    .app-wrap { font-family: 'Inter', sans-serif; max-width: 1200px; margin: 0 auto; padding-bottom: 80px; }

    /* Page Header */
    .app-header { margin-bottom: 32px; }
    .app-title { font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .app-subtitle { font-size: 15px; color: #64748b; margin-top: 8px; }

    /* Custom Tabs */
    .app-tabs { display: flex; gap: 8px; background: #f1f5f9; padding: 6px; border-radius: 12px; margin-bottom: 32px; width: max-content; }
    .app-tab { 
        padding: 10px 20px; font-size: 14px; font-weight: 600; color: #475569; 
        background: transparent; border: none; border-radius: 8px; cursor: pointer;
        display: flex; align-items: center; gap: 8px; transition: all 0.2s;
    }
    .app-tab:hover { color: #0f172a; }
    .app-tab.active { background: #fff; color: #003a9b; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

    /* Grid Layout */
    .app-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }

    /* App Card */
    .app-card {
        background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
        overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.02);
        display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s;
    }
    .app-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    
    .app-card-header { padding: 24px; border-bottom: 1px solid #f1f5f9; position: relative; }
    .app-card-header::before {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
        background: linear-gradient(90deg, #003a9b, #3b82f6);
    }
    
    .app-status { position: absolute; top: 20px; right: 20px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-PENDING { background: #f1f5f9; color: #475569; }
    .status-SHORTLISTED { background: #eff6ff; color: #003a9b; border: 1px solid #dbeafe; }
    .status-INTERVIEW { background: #fdf4ff; color: #c026d3; border: 1px solid #fae8ff; }
    .status-HIRED { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
    .status-REJECTED { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }

    .app-job-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 6px; padding-right: 90px; line-height: 1.3; }
    .app-company { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #64748b; font-weight: 500; }

    .app-card-body { padding: 20px 24px; flex-grow: 1; display: flex; flex-direction: column; gap: 12px; }
    .app-meta { display: flex; flex-wrap: wrap; gap: 12px; }
    .app-meta-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #475569; background: #f8fafc; padding: 6px 10px; border-radius: 6px; }

    .app-task-alert {
        background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px;
        margin-top: auto; display: flex; flex-direction: column; gap: 6px; alignment: stretch;
    }
    .app-task-alert.submitted { background: #f8fafc; border-color: #e2e8f0; }
    .app-task-title { font-size: 13px; font-weight: 600; color: #166534; display: flex; align-items: center; gap: 6px; }
    .app-task-alert.submitted .app-task-title { color: #64748b; }

    .app-card-footer { padding: 16px 24px; border-top: 1px solid #f1f5f9; background: #f8fafc; display: flex; gap: 10px; }
    
    /* Buttons */
    .btn {
        padding: 10px 16px; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
        display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;
        transition: all 0.15s; border: none; outline: none; flex: 1;
    }
    .btn-primary { background: #003a9b; color: #fff; box-shadow: 0 4px 10px rgba(0,58,155,0.15); }
    .btn-primary:hover:not(:disabled) { background: #002d7a; transform: translateY(-1px); }
    .btn-secondary { background: #eef2ff; color: #003a9b; border: 1px solid #c7d2fe; }
    .btn-secondary:hover:not(:disabled) { background: #e0e7ff; }
    .btn-outline { background: #fff; color: #475569; border: 1px solid #cbd5e1; flex: none; width: 44px; padding: 0; }
    .btn-outline:hover { background: #f1f5f9; color: #0f172a; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none !important; transform: none !important; }

    /* Modal Styling Additions */
    .task-modal-box { padding: 8px 0; }
    .task-instruction { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
    .task-instruction-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
    .task-instruction-list { padding-left: 20px; font-size: 14px; color: #475569; line-height: 1.6; }
    
    .task-input-section { margin-top: 16px; }
    .task-label { display: block; font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
    .task-textarea { width: 100%; height: 200px; padding: 16px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-family: monospace; font-size: 13px; resize: none; outline: none; transition: border 0.2s; }
    .task-textarea:focus { border-color: #003a9b; }
    .task-input { width: 100%; padding: 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 14px; outline: none; transition: border 0.2s; }
    .task-input:focus { border-color: #003a9b; }

    /* Submitted Box */
    .submitted-header { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 12px; margin-bottom: 16px; }
    .submission-box { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-top: 12px; }
    .submission-head { background: #f8fafc; padding: 12px 16px; font-size: 13px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    
    @media (max-width: 600px) {
        .app-tabs { width: 100%; flex-direction: column; }
        .app-grid { grid-template-columns: 1fr; }
    }
`;

export default function MyApplicationsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // UI State
    const [activeTab, setActiveTab] = useState<"all" | "shortlisted">("all");

    // Submission State
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [submissionType, setSubmissionType] = useState<"code" | "link">("code");
    const [codeContent, setCodeContent] = useState("");
    const [linkUrl, setLinkUrl] = useState("");

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const res = await fetch("/api/job-seeker/applications");
            if (!res.ok) throw new Error("Failed to fetch applications");
            const data = await res.json();
            setApplications(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load applications");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedApp) return;

        const content = submissionType === "code" ? codeContent : linkUrl;

        if (!content.trim()) {
            toast.error(`Please enter your ${submissionType}`);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/job-seeker/applications/${selectedApp.id}/submit-task`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submission: content.trim() }),
            });

            if (!res.ok) throw new Error("Failed to submit task");

            toast.success("Task submitted successfully!");
            setCodeContent("");
            setLinkUrl("");
            fetchApplications();
            setSelectedApp(null);
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit task");
        } finally {
            setSubmitting(false);
        }
    };

    const isUrl = (text: string) => {
        try {
            new URL(text);
            return true;
        } catch {
            return false;
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
            <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
    );

    const displayApps = activeTab === "all" 
        ? applications 
        : applications.filter(app => ["SHORTLISTED", "INTERVIEW", "HIRED"].includes(app.status));

    return (
        <div className="app-wrap">
            <style dangerouslySetInnerHTML={{ __html: css }} />
            
            <div className="app-header">
                <h1 className="app-title">My Applications</h1>
                <p className="app-subtitle">Track your application status and submit required role tasks.</p>
            </div>

            <div className="app-tabs">
                <button 
                    className={`app-tab ${activeTab === "all" ? "active" : ""}`}
                    onClick={() => setActiveTab("all")}
                >
                    <Briefcase size={16} /> All Applications ({applications.length})
                </button>
                <button 
                    className={`app-tab ${activeTab === "shortlisted" ? "active" : ""}`}
                    onClick={() => setActiveTab("shortlisted")}
                >
                    <CheckCircle size={16} /> Action Required / Shortlisted
                </button>
            </div>

            <div className="app-grid">
                {displayApps.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: '#64748b', fontSize: 15 }}>
                        No applications found in this category.
                    </div>
                ) : (
                    displayApps.map((app) => {
                        const hasTasks = app.job.tasks && app.job.tasks.length > 0;
                        const isShortlisted = ["SHORTLISTED", "INTERVIEW", "HIRED"].includes(app.status);
                        const hasSubmitted = app.taskSubmissions && app.taskSubmissions.length > 0;
                        
                        return (
                            <div key={app.id} className="app-card">
                                <div className="app-card-header">
                                    <div className={`app-status status-${app.status}`}>{app.status}</div>
                                    <div className="app-job-title">{app.job.title}</div>
                                    <div className="app-company"><Building size={14} /> {app.job.company}</div>
                                </div>
                                <div className="app-card-body">
                                    <div className="app-meta">
                                        <div className="app-meta-item"><MapPin size={14} /> {app.job.location}</div>
                                        <div className="app-meta-item"><Calendar size={14} /> Applied: {new Date(app.createdAt).toLocaleDateString()}</div>
                                    </div>

                                    {/* Task Alert Banner if Shortlisted and Tasks exist */}
                                    {isShortlisted && hasTasks && (
                                        <div className={`app-task-alert ${hasSubmitted ? 'submitted' : ''}`}>
                                            <div className="app-task-title">
                                                {hasSubmitted ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                                {hasSubmitted ? "Task Submitted" : "Task Required"}
                                            </div>
                                            {!hasSubmitted && (
                                                <p style={{ fontSize: 12, color: '#166534', margin: 0, opacity: 0.8 }}>
                                                    The recruiter has requested you to complete a specific task for this role.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="app-card-footer">
                                    {isShortlisted && hasTasks ? (
                                        <button 
                                            className={`btn ${hasSubmitted ? 'btn-secondary' : 'btn-primary'}`}
                                            onClick={() => setSelectedApp(app)}
                                        >
                                            {hasSubmitted ? "Manage Submission" : "Submit Required Task"} <ArrowRight size={16} />
                                        </button>
                                    ) : (
                                        <button className="btn" style={{ background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' }} disabled>
                                            Application Pending
                                        </button>
                                    )}
                                    <button className="btn btn-outline" onClick={() => router.push(`/dashboard/job-seeker/jobs/${app.job.id}`)} title="View Job Details">
                                        <ExternalLink size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Application Task Dialog */}
            <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
                <DialogContent style={{ maxWidth: 700, borderRadius: 16 }}>
                    <DialogHeader>
                        <DialogTitle style={{ fontSize: 20 }}>Task Submission</DialogTitle>
                        <DialogDescription>
                            Submit your work for <strong>{selectedApp?.job.title}</strong> at {selectedApp?.job.company}.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedApp && (
                        <div className="task-modal-box">
                            {/* Task Instructions */}
                            <div className="task-instruction">
                                <div className="task-instruction-title">Recruiter Instructions:</div>
                                <ul className="task-instruction-list">
                                    {selectedApp.job.tasks.map((t, i) => (
                                        <li key={i} style={{ marginBottom: 4 }}>
                                            {typeof t === 'string' ? t : (t as any).description || JSON.stringify(t)}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Did they already submit? */}
                            {selectedApp.taskSubmissions.length > 0 ? (
                                <div>
                                    <div className="submitted-header">
                                        <div style={{ fontWeight: 700, color: '#166534', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <CheckCircle size={16} /> Work Submitted Successfully!
                                        </div>
                                        <p style={{ fontSize: 13, color: '#15803d', marginTop: 4 }}>
                                            You have successfully sent your work. If you need to make changes, you can delete your previous submission below.
                                        </p>
                                    </div>

                                    {selectedApp.taskSubmissions.map((sub, idx) => (
                                        <div key={idx} className="submission-box">
                                            <div className="submission-head">
                                                <span>Your Submission Snapshot</span>
                                                <button 
                                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                                                    onClick={async () => {
                                                        if (!confirm("Are you sure you want to delete this submission?")) return;
                                                        try {
                                                            const res = await fetch(`/api/job-seeker/applications/${selectedApp.id}/task`, {
                                                                method: "DELETE",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({ index: idx })
                                                            });
                                                            if (!res.ok) throw new Error("Failed");
                                                            toast.success("Submission deleted");
                                                            
                                                            const updatedApp = { ...selectedApp };
                                                            updatedApp.taskSubmissions = updatedApp.taskSubmissions.filter((_, i) => i !== idx);
                                                            setSelectedApp(updatedApp);
                                                            fetchApplications();
                                                        } catch (e) {
                                                            toast.error("Failed to delete");
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                            <div style={{ padding: 16 }}>
                                                {isUrl(sub) ? (
                                                    <a href={sub} target="_blank" rel="noreferrer" style={{ color: '#003a9b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500 }}>
                                                        <ExternalLink size={16} /> {sub}
                                                    </a>
                                                ) : (
                                                    <div style={{ maxHeight: 200, overflow: 'auto', borderRadius: 8 }}>
                                                        <SyntaxHighlighter language="javascript" style={vscDarkPlus} customStyle={{ margin: 0, fontSize: 12, borderRadius: 8 }}>
                                                            {sub}
                                                        </SyntaxHighlighter>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* New Submission Form */
                                <div>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                        <button 
                                            className={`app-tab ${submissionType === "code" ? "active" : ""}`}
                                            style={{ background: submissionType === "code" ? "#dbeafe" : "#f1f5f9", color: submissionType === "code" ? "#003a9b" : "#475569" }}
                                            onClick={() => setSubmissionType("code")}
                                        >
                                            <FileCode size={16} /> Paste Code Solution
                                        </button>
                                        <button 
                                            className={`app-tab ${submissionType === "link" ? "active" : ""}`}
                                            style={{ background: submissionType === "link" ? "#dbeafe" : "#f1f5f9", color: submissionType === "link" ? "#003a9b" : "#475569" }}
                                            onClick={() => setSubmissionType("link")}
                                        >
                                            <LinkIcon size={16} /> External Link
                                        </button>
                                    </div>

                                    {submissionType === "code" ? (
                                        <div className="task-input-section">
                                            <label className="task-label">Code Editor</label>
                                            <textarea 
                                                className="task-textarea" 
                                                placeholder="// Paste your final solution code here..."
                                                value={codeContent}
                                                onChange={(e) => setCodeContent(e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="task-input-section">
                                            <label className="task-label">Project / File URL</label>
                                            <input 
                                                className="task-input"
                                                placeholder="https://github.com/username/project"
                                                value={linkUrl}
                                                onChange={(e) => setLinkUrl(e.target.value)}
                                            />
                                            <p style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>Make sure your link is publicly accessible so the recruiter can view it.</p>
                                        </div>
                                    )}

                                    <div style={{ marginTop: 24, textAlign: 'right' }}>
                                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                                            {submitting ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} fill="currentColor" />}
                                            Submit Work Now
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
