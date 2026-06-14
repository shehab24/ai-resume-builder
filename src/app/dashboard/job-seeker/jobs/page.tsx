"use client";

import { useEffect, useState, useCallback } from "react";
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
    Building2, Sparkles, ChevronRight, TrendingUp, Bot, CheckCircle2,
    XCircle, RefreshCw, Wifi, WifiOff, AlertCircle,
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

interface QueueEntry {
    id: string;
    jobUrl: string;
    status: string; // PENDING | PROCESSING | DONE | FAILED | SKIPPED
    queuedAt: string;
    processedAt?: string;
    notes?: string;
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

    /* ── pagination ── */
    .jb-pagination {
        display: flex; justify-content: center; align-items: center; gap: 8px;
        margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0;
    }
    .jb-page-btn {
        display: flex; align-items: center; justify-content: center;
        width: 36px; height: 36px; border-radius: 8px;
        border: 1.5px solid #e2e8f0; font-size: 13px; font-weight: 600;
        color: #475569; background: #fff; cursor: pointer;
        transition: all 120ms; font-family: 'Inter', sans-serif;
    }
    .jb-page-btn:hover:not(:disabled) {
        border-color: #003a9b; color: #003a9b; background: #eef2ff;
    }
    .jb-page-btn.active {
        background: #003a9b; color: #fff; border-color: #003a9b;
    }
    .jb-page-btn:disabled {
        opacity: 0.5; cursor: not-allowed;
    }
    .jb-page-arrow {
        padding: 0 12px; width: auto;
    }

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
    const [mainTab, setMainTab] = useState<"matching" | "applied" | "failed">("matching");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const jobsPerPage = 20;

    // Extension queue state
    const [extensionConnected, setExtensionConnected] = useState(false);
    const [extensionInstalledLocal, setExtensionInstalledLocal] = useState(false);
    const [extensionAuthenticated, setExtensionAuthenticated] = useState(false);
    const [queueMap, setQueueMap] = useState<Record<string, QueueEntry>>({}); // jobUrl -> QueueEntry
    const [queuingId, setQueuingId] = useState<string | null>(null);

    // Bulk enqueuing state
    const [bulkApplying, setBulkApplying]   = useState(false);
    const [bulkDoneCount, setBulkDoneCount] = useState(0);
    const [bulkTotalCount, setBulkTotalCount] = useState(0);

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
            await fetchQueue();
        })();
    }, []);

    useEffect(() => {
        let active = true;
        const handleMessage = (e: MessageEvent) => {
            if (e.data?.type === "TALENTFLOW_PONG") {
                setExtensionInstalledLocal(true);
                setExtensionAuthenticated(!!e.data.authenticated);
            }
        };
        window.addEventListener("message", handleMessage);

        const ping = () => {
            if (active) window.postMessage({ type: "TALENTFLOW_PING" }, "*");
        };
        ping();
        const interval = setInterval(ping, 1500);

        return () => {
            active = false;
            window.removeEventListener("message", handleMessage);
            clearInterval(interval);
        };
    }, []);

    // Live filter
    useEffect(() => {
        let out = jobs;
        if (mainTab === "applied") {
            // Jobs that are DONE in queue
            const doneUrls = Object.values(queueMap).filter(q => q.status === "DONE").map(q => q.jobUrl);
            out = out.filter(j => j.externalUrl && doneUrls.includes(j.externalUrl));
        } else if (mainTab === "failed") {
            const failedUrls = Object.values(queueMap).filter(q => q.status === "FAILED").map(q => q.jobUrl);
            out = out.filter(j => j.externalUrl && failedUrls.includes(j.externalUrl));
        } else {
            if (typeFilter === "internal") out = out.filter(j => !j.isExternal);
            if (typeFilter === "external") out = out.filter(j => j.isExternal);
        }
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
    }, [jobs, search, typeFilter, mainTab, queueMap]);

    // Only reset page back to 1 when search query, filter type, or main tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, typeFilter, mainTab]);

    // Paginated slices
    const indexOfLastJob = currentPage * jobsPerPage;
    const indexOfFirstJob = indexOfLastJob - jobsPerPage;
    const currentJobs = filtered.slice(indexOfFirstJob, indexOfLastJob);
    const totalPages = Math.ceil(filtered.length / jobsPerPage);

    const fetchJobs = async () => {
        try {
            const res = await fetch("/api/jobs/match");
            if (!res.ok) throw new Error();
            setJobs(await res.json());
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    const fetchQueue = async () => {
        try {
            const res = await fetch("/api/extension/queue/history");
            if (res.ok) {
                const entries: QueueEntry[] = await res.json();
                const map: Record<string, QueueEntry> = {};
                entries.forEach(e => { map[e.jobUrl] = e; });
                setQueueMap(map);
            }
        } catch { /* silent */ }
    };

    const queueJobForAutoApply = async (job: Job) => {
        if (!extensionInstalledLocal) {
            toast.error("Please load and enable the TalentFlow Extension in this browser first!");
            return;
        }
        if (!extensionAuthenticated) {
            toast.error("Please link your TalentFlow account inside the Chrome Extension first!");
            return;
        }

        const url = job.externalUrl || "";
        if (!url) { toast.error("No external URL for this job"); return; }

        setQueuingId(job.id);
        try {
            const res = await fetch("/api/extension/queue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobId: job.id,
                    jobTitle: job.title,
                    company: job.company || job.recruiter?.name,
                    jobUrl: url,
                    platform: job.source?.name?.toLowerCase() || detectPlatform(url),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 409) {
                    toast.info("Already in queue — extension will apply soon!");
                } else {
                    toast.error(data.error || "Failed to queue job");
                }
                return;
            }
            // Optimistically update queue map
            setQueueMap(prev => ({ ...prev, [url]: data }));
            toast.success("Queued! Extension will auto-apply shortly ⚡");
        } catch {
            toast.error("Failed to queue job");
        } finally {
            setQueuingId(null);
        }
    };

    const startBulkAutoApply = async () => {
        // Find matching external jobs that are not already enqueued (PENDING, PROCESSING, or DONE)
        const toQueue = filtered.filter(job => {
            if (!job.isExternal || !job.externalUrl) return false;
            const entry = queueMap[job.externalUrl];
            return !entry || (entry.status !== "PENDING" && entry.status !== "PROCESSING" && entry.status !== "DONE");
        });

        if (toQueue.length === 0) {
            toast.info("No new external jobs to apply to in the current search.");
            return;
        }

        // Apply a safe cap of 15 jobs at once (user requested 10-20 or 5-10)
        const targetJobs = toQueue.slice(0, 15);
        
        setBulkApplying(true);
        setBulkTotalCount(targetJobs.length);
        setBulkDoneCount(0);

        toast.success(`Starting bulk auto-apply for ${targetJobs.length} jobs... 🚀`);

        let successCount = 0;
        for (let i = 0; i < targetJobs.length; i++) {
            const job = targetJobs[i];
            const url = job.externalUrl || "";

            try {
                const res = await fetch("/api/extension/queue", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        jobId: job.id,
                        jobTitle: job.title,
                        company: job.company || job.recruiter?.name,
                        jobUrl: url,
                        platform: job.source?.name?.toLowerCase() || detectPlatform(url),
                    }),
                });
                const data = await res.json();
                if (res.ok) {
                    setQueueMap(prev => ({ ...prev, [url]: data }));
                    successCount++;
                }
            } catch (err) {
                console.error("Bulk queue error for job:", job.title, err);
            }
            setBulkDoneCount(i + 1);
            // Add a tiny delay between requests so we don't spam the server
            await new Promise(r => setTimeout(r, 200));
        }

        setBulkApplying(false);
        toast.success(`Successfully queued ${successCount} jobs! Extension is now auto-applying in the background ⚡`);
    };

    function detectPlatform(url: string) {
        if (url.includes("linkedin")) return "linkedin";
        if (url.includes("indeed")) return "indeed";
        if (url.includes("glassdoor")) return "glassdoor";
        if (url.includes("bdjobs")) return "bdjobs";
        return "other";
    }

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
                const d = await res.json();
                setAutoApply(d.autoApply || false);
                setMatchThreshold(d.matchThreshold || 95);
                setCurrentUserId(d.id);
                setExtensionConnected(!!d.extensionToken && !!d.extensionConnectedAt);
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

            {/* ── Main Tabs (like OptimHire) ── */}
            <div style={{
                display: "flex", gap: 0, marginBottom: 20,
                borderBottom: "2px solid #f1f5f9",
            }}>
                {([
                    { key: "matching", label: "Matching Jobs", count: jobs.filter(j => mainTab !== "matching" || true).length },
                    { key: "applied", label: "Applied", count: Object.values(queueMap).filter(q => q.status === "DONE").length },
                    { key: "failed", label: "Failed", count: Object.values(queueMap).filter(q => q.status === "FAILED").length },
                ] as const).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setMainTab(tab.key)}
                        style={{
                            padding: "10px 20px", border: "none", background: "transparent",
                            fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600,
                            cursor: "pointer", color: mainTab === tab.key ? "#003a9b" : "#64748b",
                            borderBottom: mainTab === tab.key ? "2px solid #003a9b" : "2px solid transparent",
                            marginBottom: -2, transition: "all 150ms",
                            display: "flex", alignItems: "center", gap: 6,
                        }}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span style={{
                                padding: "1px 7px", borderRadius: 999,
                                background: mainTab === tab.key ? "#003a9b" : "#f1f5f9",
                                color: mainTab === tab.key ? "#fff" : "#64748b",
                                fontSize: 11, fontWeight: 700,
                            }}>{tab.count}</span>
                        )}
                    </button>
                ))}

                {/* Extension status pill */}
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, paddingBottom: 2 }}>
                    {extensionInstalledLocal && extensionAuthenticated ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
                            <Wifi size={13} /> Extension Active
                        </span>
                    ) : extensionInstalledLocal ? (
                        <a href="/dashboard/job-seeker/auto-apply" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#d97706", fontWeight: 600, textDecoration: "none" }}>
                            <AlertCircle size={13} /> Link Extension
                        </a>
                    ) : (
                        <a href="/dashboard/job-seeker/auto-apply" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b", fontWeight: 600, textDecoration: "none" }}>
                            <WifiOff size={13} /> Install Extension
                        </a>
                    )}
                </div>
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
                <div className="jb-count-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p className="jb-count">
                        Showing <span>{filtered.length}</span> of <span>{jobs.length}</span> jobs
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {mainTab === "matching" && filtered.filter(j => j.isExternal).length > 0 && (
                            <button
                                onClick={() => startBulkAutoApply()}
                                disabled={!extensionInstalledLocal || !extensionAuthenticated || bulkApplying}
                                className="jb-apply-btn purple"
                                style={{
                                    minWidth: 0,
                                    padding: "6px 14px",
                                    fontSize: "12px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    fontWeight: "600",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                                title={!extensionInstalledLocal ? "Load/Enable extension first" : !extensionAuthenticated ? "Link extension to your account first" : "Bulk apply to matching external jobs"}
                            >
                                {bulkApplying ? (
                                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Queuing ({bulkDoneCount}/{bulkTotalCount})</>
                                ) : (
                                    <><Bot className="h-4 w-4" /> Bulk Auto-Apply ({filtered.filter(j => j.isExternal).length})</>
                                )}
                            </button>
                        )}
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
            {currentJobs.length > 0 && (
                <>
                    <div className="jb-grid">
                        {currentJobs.map(job => {
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
                                            ) : isExt ? (() => {
                                                // Bot auto-apply button for external jobs
                                                const url = job.externalUrl || "";
                                                const qEntry = queueMap[url];
                                                const isQueuing = queuingId === job.id;

                                                if (qEntry?.status === "DONE") return (
                                                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#16a34a" }}>
                                                        <CheckCircle2 size={15} /> Applied
                                                    </span>
                                                );
                                                if (qEntry?.status === "FAILED") {
                                                    const isNotEasyApply = qEntry.notes?.includes("No Easy Apply") || qEntry.notes?.includes("No Apply button");
                                                    return (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                                                            <span 
                                                                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: isNotEasyApply ? "#d97706" : "#dc2626" }}
                                                                title={qEntry.notes || ""}
                                                            >
                                                                {isNotEasyApply ? <AlertCircle size={13} /> : <XCircle size={13} />}
                                                                {isNotEasyApply ? "Manual Apply" : "Failed"}
                                                            </span>
                                                            {isNotEasyApply ? (
                                                                <a
                                                                    href={job.externalUrl || ""}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="jb-apply-btn primary"
                                                                    style={{ minWidth: 0, padding: "6px 12px", fontSize: 11, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
                                                                >
                                                                    <ExternalLink size={12} /> Apply Now
                                                                </a>
                                                            ) : (
                                                                <button
                                                                    className="jb-apply-btn purple"
                                                                    style={{ minWidth: 0, padding: "6px 12px", fontSize: 11 }}
                                                                    onClick={() => queueJobForAutoApply(job)}
                                                                >
                                                                    <RefreshCw size={12} /> Retry
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                if (qEntry?.status === "PROCESSING" || qEntry?.status === "PENDING") return (
                                                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#003a9b" }}>
                                                        <Loader2 size={14} className="animate-spin" />
                                                        {qEntry.status === "PROCESSING" ? "Applying…" : "Queued"}
                                                    </span>
                                                );

                                                return (
                                                    <button
                                                        className="jb-apply-btn purple"
                                                        disabled={isQueuing || !extensionInstalledLocal || !extensionAuthenticated}
                                                        title={!extensionInstalledLocal ? "Install Chrome Extension first" : !extensionAuthenticated ? "Link Chrome Extension first" : "Auto-apply via extension bot"}
                                                        onClick={() => (extensionInstalledLocal && extensionAuthenticated) ? queueJobForAutoApply(job) : (window.location.href = "/dashboard/job-seeker/auto-apply")}
                                                    >
                                                        {isQueuing ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
                                                        {!extensionInstalledLocal ? "Install Ext." : !extensionAuthenticated ? "Link Ext." : isQueuing ? "Queuing…" : "Auto Apply"}
                                                    </button>
                                                );
                                            })() : (
                                                <Link href={`/dashboard/job-seeker/jobs/${job.id}`} style={{ display: "contents" }}>
                                                    <button className="jb-apply-btn primary">
                                                        <Zap size={14} />
                                                        View &amp; Apply
                                                    </button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="jb-pagination">
                            <button
                                className="jb-page-btn jb-page-arrow"
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }).map((_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        className={`jb-page-btn ${currentPage === pageNum ? "active" : ""}`}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                className="jb-page-btn jb-page-arrow"
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
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
