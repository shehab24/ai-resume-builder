"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Loader2, MapPin, DollarSign, Zap, Briefcase, ExternalLink,
    Clock, Crown, Users, ArrowRightLeft, Search, SlidersHorizontal,
    Building2, Sparkles, ChevronRight, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/use-subscription";

interface Job {
    id: string;
    title: string;
    description: string;
    location: string;
    salary: string;
    requirements: string[];
    createdAt: string;
    jobType?: string;
    workMode?: string;
    isExternal?: boolean;
    externalUrl?: string;
    applicationMethod?: string;
    applicationEmail?: string;
    company?: string;
    recruiter: { name: string };
    recruiterId?: string;
    source?: { name: string };
}

/* ─────────────────────────────────────────────
   Inline styles — consistent with TalentFlow
   sidebar brand (#003a9b, Inter, clean whites)
───────────────────────────────────────────── */
const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    .jb-wrap    { font-family: 'Inter', sans-serif; }
    .jb-header  { margin-bottom: 28px; }
    .jb-title   { font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; }
    .jb-sub     { font-size: 14px; color: #64748b; margin-top: 4px; }

    /* ── search / filters bar ── */
    .jb-bar {
        display: flex; gap: 12px; flex-wrap: wrap;
        background: #fff; border: 1px solid #e2e8f0;
        border-radius: 14px; padding: 14px 18px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        margin-bottom: 24px;
    }
    .jb-search-wrap { position: relative; flex: 1; min-width: 220px; }
    .jb-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .jb-search {
        width: 100%; padding: 9px 12px 9px 38px;
        border: 1.5px solid #e2e8f0; border-radius: 10px;
        font-size: 14px; font-family: 'Inter', sans-serif; color: #1e293b;
        outline: none; transition: border 150ms;
    }
    .jb-search:focus { border-color: #003a9b; }
    .jb-filter-btn {
        display: flex; align-items: center; gap: 6px;
        padding: 9px 14px; border: 1.5px solid #e2e8f0;
        border-radius: 10px; font-size: 13px; font-weight: 500;
        color: #64748b; background: #fff; cursor: pointer;
        transition: all 120ms; white-space: nowrap;
        font-family: 'Inter', sans-serif;
    }
    .jb-filter-btn:hover, .jb-filter-btn.active { border-color: #003a9b; color: #003a9b; background: #eef2ff; }

    /* ── auto-apply banner ── */
    .jb-autoapply {
        display: flex; align-items: center; gap: 14px;
        background: linear-gradient(135deg, #003a9b 0%, #1d4ed8 100%);
        color: #fff; border-radius: 14px; padding: 16px 20px;
        margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0,58,155,0.2);
    }
    .jb-autoapply-icon {
        width: 44px; height: 44px; border-radius: 12px;
        background: rgba(255,255,255,0.18);
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .jb-autoapply-title { font-size: 15px; font-weight: 700; }
    .jb-autoapply-sub   { font-size: 12px; opacity: .8; margin-top: 2px; }
    .jb-toggle {
        position: relative; width: 48px; height: 26px;
        background: rgba(255,255,255,0.25); border-radius: 999px;
        border: none; cursor: pointer; transition: background 200ms; flex-shrink: 0;
    }
    .jb-toggle.on  { background: #22c55e; }
    .jb-toggle::after {
        content: ''; position: absolute; top: 3px; left: 3px;
        width: 20px; height: 20px; border-radius: 50%; background: #fff;
        transition: transform 200ms;
    }
    .jb-toggle.on::after { transform: translateX(22px); }
    .jb-toggle:disabled { opacity: .5; cursor: not-allowed; }

    /* pro upsell inside banner */
    .jb-upgrade-btn {
        padding: 7px 16px; background: #f59e0b; color: #fff;
        border: none; border-radius: 8px; font-size: 12px; font-weight: 700;
        cursor: pointer; white-space: nowrap; font-family: 'Inter', sans-serif;
        transition: background 150ms; flex-shrink: 0;
    }
    .jb-upgrade-btn:hover { background: #d97706; }

    /* ── count row ── */
    .jb-count-row {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 16px;
    }
    .jb-count { font-size: 13px; font-weight: 600; color: #64748b; }
    .jb-count span { color: #003a9b; }

    /* ── list / row layout ── */
    .jb-grid { display: flex; flex-direction: column; gap: 12px; }

    /* ── job card ── */
    .jb-card {
        background: #fff; border: 1px solid #e2e8f0;
        border-radius: 12px; overflow: hidden;
        display: flex; flex-direction: row; align-items: stretch;
        transition: box-shadow 180ms, border-color 180ms, transform 180ms;
        cursor: default; min-height: 100px;
    }
    .jb-card:hover {
        box-shadow: 0 4px 16px rgba(0,58,155,0.08);
        border-color: #cbd5e1;
        transform: translateY(-1px);
    }
    .jb-card-accent { width: 4px; flex-shrink: 0; }
    .jb-card-accent.internal { background: linear-gradient(180deg, #003a9b, #2563eb); }
    .jb-card-accent.external { background: linear-gradient(180deg, #7c3aed, #a855f7); }
    .jb-card-accent.own      { background: linear-gradient(180deg, #0891b2, #0ea5e9); }

    .jb-card-body { 
        padding: 18px 20px; flex: 1; 
        display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 20px;
    }

    /* main info (left side) */
    .jb-main-info { display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0; }
    
    .jb-logo {
        width: 48px; height: 48px; border-radius: 10px; flex-shrink: 0;
        background: #eef2ff; display: flex; align-items: center; justify-content: center;
    }
    .jb-logo.ext { background: #f3e8ff; }
    .jb-logo.own { background: #e0f2fe; }
    
    .jb-card-titles { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
    .jb-job-title {
        font-size: 15px; font-weight: 700; color: #0f172a;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    
    .jb-meta-row {
        display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    }
    .jb-company {
        font-size: 13px; color: #475569; font-weight: 500;
        display: flex; align-items: center; gap: 4px;
    }
    .jb-meta-dot { color: #cbd5e1; font-size: 10px; }

    /* chips */
    .jb-chips { display: flex; align-items: center; gap: 6px; }
    .jb-chip {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 4px 8px; border-radius: 6px;
        font-size: 11px; font-weight: 600;
        font-family: 'Inter', sans-serif; white-space: nowrap;
    }
    .jb-chip.loc   { background: #f1f5f9; color: #475569; }
    .jb-chip.sal   { background: #f0fdf4; color: #16a34a; }
    .jb-chip.ext   { background: #faf5ff; color: #7c3aed; }
    .jb-chip.own   { background: #eff6ff; color: #1d4ed8; }
    .jb-chip.type  { background: #fff7ed; color: #ea580c; }
    .jb-chip.mode  { background: #ecfeff; color: #0891b2; }

    /* skill tags */
    .jb-skills { display: flex; align-items: center; gap: 5px; margin-top: 8px; flex-wrap: wrap; }
    .jb-skill {
        padding: 3px 8px; background: #f8fafc; border: 1px solid #e2e8f0;
        border-radius: 6px; font-size: 11px; font-weight: 500;
        color: #475569; font-family: 'Inter', sans-serif;
        max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    /* right side (date + action button) */
    .jb-card-right { 
        display: flex; flex-direction: row; align-items: center; gap: 24px; flex-shrink: 0;
    }
    
    .jb-posted {
        font-size: 12px; color: #94a3b8; white-space: nowrap;
        display: flex; align-items: center; gap: 4px;
    }

    /* action buttons */
    .jb-apply-btn {
        padding: 9px 18px;
        border-radius: 8px; border: none;
        font-size: 13px; font-weight: 600;
        font-family: 'Inter', sans-serif; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 6px;
        transition: all 150ms; white-space: nowrap; min-width: 130px;
    }
    .jb-apply-btn.primary { background: #003a9b; color: #fff; }
    .jb-apply-btn.primary:hover { background: #002d7a; }
    .jb-apply-btn.purple  { background: #7c3aed; color: #fff; }
    .jb-apply-btn.purple:hover  { background: #6d28d9; }
    .jb-apply-btn.outline { background: #fff; color: #003a9b; border: 1.5px solid #c7d6f5; }
    .jb-apply-btn.outline:hover { background: #eef2ff; }

    /* empty state */
    .jb-empty {
        text-align: center; padding: 80px 20px;
        display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
    .jb-empty-icon {
        width: 72px; height: 72px; border-radius: 20px;
        background: #f1f5f9; display: flex; align-items: center; justify-content: center;
    }
    .jb-empty h3 { font-size: 17px; font-weight: 700; color: #0f172a; }
    .jb-empty p  { font-size: 14px; color: #64748b; max-width: 320px; line-height: 1.6; }

    /* loader */
    .jb-loading {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        min-height: 300px; gap: 14px;
    }
    .jb-spinner {
        width: 36px; height: 36px; border: 3px solid #e2e8f0;
        border-top-color: #003a9b; border-radius: 50%;
        animation: jb-spin 0.8s linear infinite;
    }
    @keyframes jb-spin { to { transform: rotate(360deg); } }
    .jb-loading p { font-size: 14px; color: #64748b; font-family: 'Inter', sans-serif; }

    @media (max-width: 640px) {
        .jb-autoapply { flex-wrap: wrap; }
    }
    @media (max-width: 768px) {
        .jb-card-body { flex-direction: column; align-items: flex-start; gap: 16px; }
        .jb-card-right { width: 100%; justify-content: space-between; }
        .jb-main-info { width: 100%; }
        .jb-meta-row { flex-direction: column; align-items: flex-start; gap: 8px; }
        .jb-chips { flex-wrap: wrap; }
    }
`;

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    if (d < 7)  return `${d} days ago`;
    if (d < 30) return `${Math.floor(d / 7)}w ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function FindJobsPage() {
    const [jobs, setJobs]         = useState<Job[]>([]);
    const [filtered, setFiltered] = useState<Job[]>([]);
    const [loading, setLoading]   = useState(true);
    const [autoApply, setAutoApply]       = useState(false);
    const [updatingAA, setUpdatingAA]     = useState(false);
    const [isPro, setIsPro]               = useState(false);
    const [matchThreshold, setMatchThreshold] = useState(95);
    const [currentUserId, setCurrentUserId]   = useState<string | null>(null);
    const [search, setSearch]     = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | "internal" | "external">("all");

    // Switch role dialog
    const [showSwitchDialog, setShowSwitchDialog] = useState(false);
    const [selectedJobId, setSelectedJobId]       = useState<string | null>(null);
    const [switchingRole, setSwitchingRole]       = useState(false);

    const { subscribe, loading: subscribing } = useSubscription();

    useEffect(() => {
        (async () => {
            await fetchProfile();
            await fetchJobs();
            await fetchSubStatus();
        })();
    }, []);

    // Live filter
    useEffect(() => {
        let out = jobs;
        if (typeFilter === "internal") out = out.filter(j => !j.isExternal);
        if (typeFilter === "external") out = out.filter(j => j.isExternal);
        if (search.trim()) {
            const q = search.toLowerCase();
            out = out.filter(j =>
                j.title.toLowerCase().includes(q) ||
                (j.company || j.recruiter?.name || "").toLowerCase().includes(q) ||
                j.location?.toLowerCase().includes(q) ||
                j.requirements.some(r => r.toLowerCase().includes(q))
            );
        }
        setFiltered(out);
    }, [jobs, search, typeFilter]);

    const fetchJobs = async () => {
        try {
            const res = await fetch("/api/jobs/match");
            if (!res.ok) throw new Error();
            setJobs(await res.json());
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
                const d = await res.json();
                setAutoApply(d.autoApply || false);
                setMatchThreshold(d.matchThreshold || 95);
                setCurrentUserId(d.id);
            }
        } catch { /* silent */ }
    };

    const fetchSubStatus = async () => {
        try {
            const res = await fetch("/api/user/subscription");
            if (res.ok) {
                const d = await res.json();
                setIsPro(d.subscription?.status === "ACTIVE" && d.subscription?.plan === "PRO");
            }
        } catch { /* silent */ }
    };

    const toggleAutoApply = async () => {
        if (!isPro && !autoApply) {
            toast.error("Auto-Apply is a Pro feature. Upgrade to enable it.");
            return;
        }
        setUpdatingAA(true);
        try {
            const next = !autoApply;
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ autoApply: next }),
            });
            if (!res.ok) throw new Error();
            setAutoApply(next);
            toast.success(next ? "Auto-Apply enabled 🚀" : "Auto-Apply disabled");
        } catch { toast.error("Failed to update Auto-Apply"); }
        finally { setUpdatingAA(false); }
    };

    const handleSwitchToRecruiter = async () => {
        setSwitchingRole(true);
        try {
            const res = await fetch("/api/user/switch-role", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newRole: "RECRUITER" }),
            });
            const d = await res.json();
            if (res.ok) {
                toast.success("Switched to Recruiter!");
                window.location.href = `/dashboard/recruiter/jobs/${selectedJobId}/applications`;
            } else {
                toast.error(d.error || "Failed to switch role");
            }
        } catch { toast.error("Failed to switch role"); }
        finally { setSwitchingRole(false); }
    };

    if (loading) {
        return (
            <div className="jb-wrap">
                <style dangerouslySetInnerHTML={{ __html: css }} />
                <div className="jb-loading">
                    <div className="jb-spinner" />
                    <p>Finding matching jobs for you…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="jb-wrap">
            <style dangerouslySetInnerHTML={{ __html: css }} />

            {/* ── Page Header ── */}
            <div className="jb-header">
                <h1 className="jb-title">My Jobs</h1>
                <p className="jb-sub">
                    {jobs.length > 0
                        ? `${jobs.length} jobs matched to your profile · sorted by best fit`
                        : "No matched jobs yet — complete your profile to unlock matches"}
                </p>
            </div>

            {/* ── Auto-Apply Banner ── */}
            <div className="jb-autoapply">
                <div className={`jb-autoapply-icon`}>
                    {isPro ? <Sparkles size={22} /> : <Crown size={22} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="jb-autoapply-title">
                        Auto-Apply
                        {!isPro && (
                            <span style={{
                                marginLeft: 8, fontSize: 10, fontWeight: 700,
                                background: "#f59e0b", color: "#fff",
                                padding: "2px 7px", borderRadius: 999,
                            }}>
                                PRO
                            </span>
                        )}
                    </div>
                    <div className="jb-autoapply-sub">
                        {isPro
                            ? autoApply
                                ? `✓ Enabled — auto-applying to ${matchThreshold}%+ match jobs`
                                : "Toggle on to automatically apply to matching jobs"
                            : "Upgrade to Pro to apply to hundreds of jobs automatically"}
                    </div>
                </div>

                {isPro ? (
                    <button
                        className={`jb-toggle ${autoApply ? "on" : ""}`}
                        onClick={toggleAutoApply}
                        disabled={updatingAA}
                        title={autoApply ? "Disable Auto-Apply" : "Enable Auto-Apply"}
                    />
                ) : (
                    <button
                        className="jb-upgrade-btn"
                        onClick={() => subscribe("PRO", 299)}
                        disabled={subscribing}
                    >
                        <Crown size={12} style={{ display: "inline", marginRight: 5 }} />
                        {subscribing ? "Processing…" : "Upgrade — ৳299/mo"}
                    </button>
                )}
            </div>

            {/* ── Search & Filter Bar ── */}
            <div className="jb-bar">
                <div className="jb-search-wrap">
                    <Search size={16} className="jb-search-icon" />
                    <input
                        className="jb-search"
                        placeholder="Search by title, company, skill, location…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button
                    className={`jb-filter-btn ${typeFilter === "all" ? "active" : ""}`}
                    onClick={() => setTypeFilter("all")}
                >
                    All
                </button>
                <button
                    className={`jb-filter-btn ${typeFilter === "internal" ? "active" : ""}`}
                    onClick={() => setTypeFilter("internal")}
                >
                    <Briefcase size={14} /> Platform Jobs
                </button>
                <button
                    className={`jb-filter-btn ${typeFilter === "external" ? "active" : ""}`}
                    onClick={() => setTypeFilter("external")}
                >
                    <ExternalLink size={14} /> External
                </button>
            </div>

            {/* ── Count row ── */}
            {jobs.length > 0 && (
                <div className="jb-count-row">
                    <p className="jb-count">
                        Showing <span>{filtered.length}</span> of <span>{jobs.length}</span> jobs
                    </p>
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            style={{
                                fontSize: 12, color: "#003a9b", background: "none",
                                border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif",
                            }}
                        >
                            Clear search
                        </button>
                    )}
                </div>
            )}

            {/* ── Empty state ── */}
            {filtered.length === 0 && (
                <div className="jb-empty">
                    <div className="jb-empty-icon">
                        <Briefcase size={32} color="#94a3b8" />
                    </div>
                    <h3>{search || typeFilter !== "all" ? "No jobs match your filters" : "No jobs found yet"}</h3>
                    <p>
                        {search || typeFilter !== "all"
                            ? "Try adjusting your search or clearing filters."
                            : "Complete your profile with skills and experience so we can match you with jobs."}
                    </p>
                    {(search || typeFilter !== "all") && (
                        <button
                            onClick={() => { setSearch(""); setTypeFilter("all"); }}
                            style={{
                                marginTop: 8, padding: "9px 20px",
                                background: "#003a9b", color: "#fff",
                                border: "none", borderRadius: 10, fontSize: 13,
                                fontWeight: 600, cursor: "pointer",
                                fontFamily: "Inter, sans-serif",
                            }}
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            )}

            {/* ── Job Cards Grid ── */}
            {filtered.length > 0 && (
                <div className="jb-grid">
                    {filtered.map(job => {
                        const isOwn     = job.recruiterId === currentUserId;
                        const isExt     = job.isExternal;
                        const accentCls = isOwn ? "own" : isExt ? "external" : "internal";
                        const logoCls   = isOwn ? "own" : isExt ? "ext" : "";
                        const company   = job.company || job.recruiter?.name || "TalentFlow";

                        return (
                            <div key={job.id} className="jb-card">
                                {/* Accent stripe */}
                                <div className={`jb-card-accent ${accentCls}`} />

                                <div className="jb-card-body">
                                    {/* Main info (left) */}
                                    <div className="jb-main-info">
                                        <div className={`jb-logo ${logoCls}`}>
                                            {isOwn  ? <Briefcase size={22} color="#0891b2" /> :
                                             isExt  ? <ExternalLink size={22} color="#7c3aed" /> :
                                                      <Building2 size={22} color="#003a9b" />}
                                        </div>
                                        <div className="jb-card-titles">
                                            <div className="jb-job-title" title={job.title}>{job.title}</div>
                                            <div className="jb-meta-row">
                                                <div className="jb-company">
                                                    {company}
                                                </div>
                                                <div className="jb-meta-dot">•</div>
                                                <div className="jb-chips">
                                                    {job.jobType && (
                                                        <span className="jb-chip type">
                                                            <Briefcase size={11} /> {job.jobType}
                                                        </span>
                                                    )}
                                                    {job.workMode && (
                                                        <span className="jb-chip mode">
                                                            <MapPin size={11} /> {job.workMode}
                                                        </span>
                                                    )}
                                                    {job.location && (
                                                        <span className="jb-chip loc">
                                                            <MapPin size={11} /> {job.location}
                                                        </span>
                                                    )}
                                                    {job.salary && (
                                                        <span className="jb-chip sal">
                                                            <DollarSign size={11} /> {job.salary}
                                                        </span>
                                                    )}
                                                    {isExt && (
                                                        <span className="jb-chip ext">
                                                            <ExternalLink size={11} /> {job.source?.name || "External"}
                                                        </span>
                                                    )}
                                                    {isOwn && (
                                                        <span className="jb-chip own">
                                                            <Briefcase size={11} /> Your Post
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Skills */}
                                            {job.requirements && job.requirements.length > 0 && (() => {
                                                // Only show short tags, ignore full sentence paragraphs from scraped jobs
                                                const shortSkills = job.requirements.filter(r => r.length <= 35);
                                                if (shortSkills.length === 0) return null;
                                                
                                                return (
                                                    <div className="jb-skills">
                                                        {shortSkills.slice(0, 4).map((r, i) => (
                                                            <span key={i} className="jb-skill" title={r}>{r}</span>
                                                        ))}
                                                        {shortSkills.length > 4 && (
                                                            <span className="jb-skill" style={{ color: "#003a9b", border: "none", background: "transparent", paddingLeft: 0 }}>
                                                                +{shortSkills.length - 4} more
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Actions (right) */}
                                    <div className="jb-card-right">
                                        <div className="jb-posted">
                                            <Clock size={12} />
                                            {timeAgo(job.createdAt)}
                                        </div>

                                        {isOwn ? (
                                            <button
                                                className="jb-apply-btn outline"
                                                onClick={() => {
                                                    setSelectedJobId(job.id);
                                                    setShowSwitchDialog(true);
                                                }}
                                            >
                                                <Users size={14} />
                                                View Apps
                                            </button>
                                        ) : isExt ? (
                                            <button
                                                className="jb-apply-btn purple"
                                                onClick={() => {
                                                    if (job.applicationMethod === "EMAIL" && job.applicationEmail) {
                                                        window.location.href = `mailto:${job.applicationEmail}`;
                                                    } else if (job.externalUrl) {
                                                        window.open(job.externalUrl, "_blank");
                                                    }
                                                }}
                                            >
                                                <ExternalLink size={14} />
                                                Apply
                                            </button>
                                        ) : (
                                            <Link href={`/dashboard/job-seeker/jobs/${job.id}`} style={{ display: "contents" }}>
                                                <button className="jb-apply-btn primary">
                                                    <Zap size={14} />
                                                    View & Apply
                                                </button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Switch Role Dialog ── */}
            <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                            Switch to Recruiter Role
                        </DialogTitle>
                        <DialogDescription>
                            To view applications for this job, you need to switch to your Recruiter role.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div style={{
                            background: "#eff6ff", border: "1px solid #bfdbfe",
                            borderRadius: 10, padding: "14px 16px",
                            fontSize: 14, color: "#1e40af", lineHeight: 1.6,
                        }}>
                            You&apos;ll be switched to Recruiter mode and redirected to the applications page for this job.
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSwitchDialog(false)} disabled={switchingRole}>
                            Cancel
                        </Button>
                        <Button onClick={handleSwitchToRecruiter} disabled={switchingRole} style={{ background: "#003a9b" }}>
                            {switchingRole ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Switching…</>
                            ) : (
                                <><ArrowRightLeft className="mr-2 h-4 w-4" /> Switch &amp; View Applications</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
