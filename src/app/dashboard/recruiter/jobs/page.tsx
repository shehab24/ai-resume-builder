"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Briefcase, MapPin, DollarSign, Trash2, Pencil, Users, Trophy, Crown, Calendar, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/use-subscription";
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

interface Job {
    id: string;
    title: string;
    description: string;
    location?: string;
    salary?: string;
    requirements: string[];
    recruiter: { name: string; email: string };
    jobType?: string;
    workMode?: string;
    experienceLevel?: string;
    benefits?: string[];
    applicationDeadline?: string;
    tasks?: string[];
    applicantCount?: number;
    createdAt: string;
}

const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    .rj-wrap { font-family: 'Inter', sans-serif; max-width: 1200px; margin: 0 auto; padding-bottom: 80px; }

    /* Page Header */
    .rj-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; gap: 16px; flex-wrap: wrap; }
    .rj-title { font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; margin: 0; }
    .rj-subtitle { font-size: 15px; color: #64748b; margin-top: 8px; }

    .btn-create {
        padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif;
        display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;
        background: #003a9b; color: #fff; border: none; outline: none; transition: all 0.15s;
        box-shadow: 0 4px 10px rgba(0,58,155,0.15);
    }
    .btn-create:hover { background: #002d7a; transform: translateY(-1px); }

    /* Grid Layout */
    .rj-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }

    /* Job Card */
    .rj-card {
        background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
        overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.02);
        display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s;
    }
    .rj-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }

    .rj-card-head { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: relative; }
    .rj-card-head::before {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
        background: linear-gradient(90deg, #003a9b, #3b82f6);
    }
    .rj-card-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 6px; line-height: 1.3; padding-right: 50px; }
    .rj-applicants-badge {
        position: absolute; top: 20px; right: 20px; background: #eef2ff; color: #003a9b;
        font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px;
        display: flex; align-items: center; gap: 4px; border: 1px solid #dbeafe;
    }
    .rj-card-desc { font-size: 14px; color: #64748b; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 8px; }

    .rj-card-body { padding: 20px 24px; flex-grow: 1; display: flex; flex-direction: column; gap: 16px; }
    .rj-meta-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .rj-meta-pill { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
    .rj-meta-pill.location { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
    .rj-meta-pill.salary { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .rj-meta-pill.type { background: #eff6ff; color: #1e3a8a; border: 1px solid #bfdbfe; }
    .rj-meta-pill.mode { background: #faf5ff; color: #6b21a8; border: 1px solid #e9d5ff; }

    .rj-skills { display: flex; flex-wrap: wrap; gap: 6px; }
    .rj-skill { font-size: 11px; font-weight: 600; color: #475569; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
    
    .rj-card-footer { padding: 16px 20px; border-top: 1px solid #f1f5f9; background: #f8fafc; display: flex; flex-direction: column; gap: 10px; }
    
    .rj-btn-group { display: flex; gap: 8px; }
    .rj-btn {
        flex: 1; padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif;
        display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; border: none; transition: 0.15s; outline: none;
    }
    .rj-btn.primary { background: #fff; color: #003a9b; border: 1px solid #cbd5e1; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .rj-btn.primary:hover { background: #f8fafc; border-color: #003a9b; }
    .rj-btn.pro { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .rj-btn.pro:hover:not(:disabled) { background: #fef3c7; border-color: #fcd34d; }
    .rj-btn.pro:disabled { opacity: 0.7; cursor: not-allowed; }
    .rj-btn.pro-active { background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; }
    .rj-btn.pro-active:hover { background: #e0e7ff; border-color: #a5b4fc; }

    .rj-btn.outline { background: #fff; color: #475569; border: 1px solid #e2e8f0; }
    .rj-btn.outline:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
    .rj-btn.danger { background: #fff; color: #ef4444; border: 1px solid #fecaca; }
    .rj-btn.danger:hover { background: #fef2f2; border-color: #fca5a5; }

    .rj-date { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #94a3b8; font-weight: 500; padding: 0 4px; }
    
    @media (max-width: 600px) {
        .rj-header { flex-direction: column; align-items: flex-start; }
        .rj-grid { grid-template-columns: 1fr; }
    }
`;

export default function RecruiterJobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPro, setIsPro] = useState(false);
    const { subscribe, loading: subscribing } = useSubscription();

    useEffect(() => {
        fetchJobs();
        fetchSubscriptionStatus();
    }, []);

    const fetchSubscriptionStatus = async () => {
        try {
            const res = await fetch("/api/user/subscription");
            if (res.ok) {
                const data = await res.json();
                setIsPro(data.subscription?.status === 'ACTIVE' && data.subscription?.plan === 'PRO');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchJobs = async () => {
        try {
            const res = await fetch("/api/recruiter/jobs");
            if (!res.ok) throw new Error("Failed to fetch jobs");
            const data = await res.json();
            setJobs(data);
        } catch (err) {
            console.error(err);
            toast.error("Could not load your posted jobs.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (jobId: string) => {
        setJobToDelete(jobId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!jobToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/recruiter/jobs/${jobToDelete}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete job");

            toast.success("Job deleted successfully!");
            setJobs(jobs.filter(j => j.id !== jobToDelete));
            setDeleteDialogOpen(false);
            setJobToDelete(null);
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete job");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="rj-wrap">
                <style dangerouslySetInnerHTML={{ __html: css }} />
                <div className="rj-header">
                    <div>
                        <h1 className="rj-title">My Job Postings</h1>
                        <p className="rj-subtitle">Manage your job listings and track applications</p>
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '100px 0', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <Briefcase size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>No jobs posted yet</h3>
                    <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Get started by creating your first job listing.</p>
                    <button className="btn-create" onClick={() => router.push("/dashboard/recruiter/jobs/create")}>
                        <Briefcase size={16} /> Post a Job
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rj-wrap">
            <style dangerouslySetInnerHTML={{ __html: css }} />
            
            <div className="rj-header">
                <div>
                    <h1 className="rj-title">My Job Postings</h1>
                    <p className="rj-subtitle">Manage your job listings and track applications</p>
                </div>
                <button className="btn-create" onClick={() => router.push("/dashboard/recruiter/jobs/create")}>
                    <Briefcase size={16} /> Post New Job
                </button>
            </div>

            <div className="rj-grid">
                {jobs.map((job) => (
                    <div key={job.id} className="rj-card">
                        <div className="rj-card-head">
                            <h3 className="rj-card-title" title={job.title}>{job.title}</h3>
                            <div className="rj-applicants-badge" title="Total Applicants">
                                <Users size={12} strokeWidth={3} /> {job.applicantCount || 0}
                            </div>
                            <p className="rj-card-desc">{job.description}</p>
                        </div>

                        <div className="rj-card-body">
                            {/* Meta Badges */}
                            <div className="rj-meta-row">
                                {job.location && (
                                    <div className="rj-meta-pill location">
                                        <MapPin size={12} /> {job.location}
                                    </div>
                                )}
                                {job.salary && (
                                    <div className="rj-meta-pill salary">
                                        <DollarSign size={12} /> {job.salary}
                                    </div>
                                )}
                                {job.jobType && (
                                    <div className="rj-meta-pill type">
                                        {job.jobType}
                                    </div>
                                )}
                                {job.workMode && (
                                    <div className="rj-meta-pill mode">
                                        {job.workMode}
                                    </div>
                                )}
                            </div>

                            {/* Skills snippet */}
                            {job.requirements && job.requirements.length > 0 && (
                                <div className="rj-skills">
                                    {job.requirements.slice(0, 4).map((req, i) => (
                                        <div key={i} className="rj-skill">{req}</div>
                                    ))}
                                    {job.requirements.length > 4 && (
                                        <div className="rj-skill" style={{ background: '#e2e8f0' }}>+{job.requirements.length - 4}</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="rj-card-footer">
                            <div className="rj-btn-group">
                                <button className="rj-btn primary" onClick={() => router.push(`/dashboard/recruiter/jobs/${job.id}/applications`)}>
                                    <Users size={14} /> Applicants
                                </button>
                                <button 
                                    className={`rj-btn ${isPro ? 'pro-active' : 'pro'}`}
                                    onClick={() => !isPro ? subscribe('PRO', 999) : router.push(`/dashboard/recruiter/jobs/${job.id}/candidates`)}
                                    disabled={subscribing}
                                >
                                    {subscribing ? <Loader2 size={14} className="animate-spin" /> : (!isPro ? <Crown size={14} /> : <Sparkles size={14} />)}
                                    {subscribing ? 'Processing...' : (!isPro ? 'Unlock AI Ranks' : 'AI Rankings')}
                                </button>
                            </div>
                            <div className="rj-btn-group">
                                <button className="rj-btn outline" onClick={() => router.push(`/dashboard/recruiter/jobs/${job.id}/edit`)}>
                                    <Pencil size={14} /> Edit
                                </button>
                                <button className="rj-btn danger" onClick={() => handleDeleteClick(job.id)}>
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                            <div className="rj-date">
                                <span><Calendar size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} /> Posted</span>
                                <span>{new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent style={{ borderRadius: 16 }}>
                    <AlertDialogHeader>
                        <AlertDialogTitle style={{ fontSize: 20 }}>Delete Job Posting</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete this job and all its application records? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting} style={{ borderRadius: 8 }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            style={{ background: '#ef4444', color: '#fff', borderRadius: 8 }}
                        >
                            {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : "Yes, Delete Job"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
