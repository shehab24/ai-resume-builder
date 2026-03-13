"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle, Clock, Mail, Globe, Users, ShieldOff, ShieldCheck, AlertTriangle, Search, Trash2, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface RecruiterApplication {
    id: string;
    name: string;
    email: string;
    role: string;
    recruiterStatus: string;
    companyInfo: {
        companyName: string;
        companyEmail: string;
        emailVerified: boolean;
        website: string;
        size?: string;
        description?: string;
        submittedAt: string;
    };
}

interface ConfirmModal {
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmStyle: "danger" | "warning" | "primary";
    icon: "remove" | "block" | "approve";
    onConfirm: () => void;
}

const MODAL_CLOSED: ConfirmModal = {
    open: false, title: "", message: "", confirmLabel: "", confirmStyle: "danger",
    icon: "remove", onConfirm: () => {},
};

const pageStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    .ra-page { font-family: 'Inter', sans-serif; }

    /* ── Custom Confirm Modal ── */
    .ra-overlay {
        position: fixed; inset: 0; z-index: 999;
        background: rgba(15, 23, 42, 0.45);
        backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        animation: ra-fade-in 150ms ease;
    }
    @keyframes ra-fade-in { from { opacity: 0; } to { opacity: 1; } }
    .ra-modal {
        background: #fff; border-radius: 20px; padding: 32px 28px 24px;
        width: 100%; max-width: 420px; box-shadow: 0 24px 64px rgba(0,0,0,0.18);
        animation: ra-slide-up 180ms cubic-bezier(.34,1.56,.64,1);
        position: relative;
    }
    @keyframes ra-slide-up { from { transform: translateY(20px) scale(0.97); opacity: 0; } to { transform: none; opacity: 1; } }
    .ra-modal-icon {
        width: 52px; height: 52px; border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 18px;
    }
    .ra-modal-icon.danger  { background: #fef2f2; }
    .ra-modal-icon.warning { background: #fef3c7; }
    .ra-modal-icon.primary { background: #eff6ff; }
    .ra-modal-title { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
    .ra-modal-msg   { font-size: 14px; color: #64748b; margin: 0 0 24px; line-height: 1.6; }
    .ra-modal-msg strong { color: #1e293b; font-weight: 600; }
    .ra-modal-email {
        display: inline-block; background: #f8fafc; border: 1px solid #e2e8f0;
        border-radius: 8px; padding: 6px 12px; font-size: 13px;
        font-weight: 600; color: #334155; margin: 6px 0 0; font-family: monospace;
    }
    .ra-modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .ra-modal-cancel {
        padding: 10px 22px; border-radius: 10px; font-size: 14px; font-weight: 600;
        border: 1.5px solid #e2e8f0; background: #fff; color: #64748b;
        cursor: pointer; font-family: 'Inter', sans-serif; transition: background 120ms;
    }
    .ra-modal-cancel:hover { background: #f8fafc; }
    .ra-modal-confirm {
        padding: 10px 22px; border-radius: 10px; font-size: 14px; font-weight: 600;
        border: none; cursor: pointer; font-family: 'Inter', sans-serif;
        display: flex; align-items: center; gap: 7px; transition: opacity 150ms;
    }
    .ra-modal-confirm:hover { opacity: 0.88; }
    .ra-modal-confirm.danger  { background: #dc2626; color: #fff; }
    .ra-modal-confirm.warning { background: #d97706; color: #fff; }
    .ra-modal-confirm.primary { background: #003a9b; color: #fff; }
    .ra-modal-close {
        position: absolute; top: 16px; right: 16px;
        background: #f1f5f9; border: none; cursor: pointer;
        width: 30px; height: 30px; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        color: #94a3b8; transition: background 120ms, color 120ms;
    }
    .ra-modal-close:hover { background: #e2e8f0; color: #475569; }

    /* Search bar */
    .ra-search-wrap { position: relative; margin-bottom: 20px; }
    .ra-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
    .ra-search-input {
        width: 100%; padding: 11px 40px 11px 42px; border: 1.5px solid #e2e8f0;
        border-radius: 12px; font-size: 14px; font-family: 'Inter', sans-serif;
        color: #1e293b; background: #fff; outline: none;
        transition: border-color 150ms, box-shadow 150ms; box-sizing: border-box;
    }
    .ra-search-input:focus { border-color: #003a9b; box-shadow: 0 0 0 3px rgba(0,58,155,0.08); }
    .ra-search-clear {
        position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
        background: none; border: none; cursor: pointer; color: #94a3b8;
        display: flex; align-items: center; padding: 2px; border-radius: 50%; transition: color 120ms;
    }
    .ra-search-clear:hover { color: #475569; }

    /* Tabs */
    .ra-tabs { display: flex; gap: 4px; background: #f1f5f9; padding: 4px; border-radius: 12px; margin-bottom: 24px; }
    .ra-tab { flex: 1; padding: 9px 16px; border: none; border-radius: 9px; cursor: pointer; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; transition: background 150ms, color 150ms; background: transparent; color: #64748b; }
    .ra-tab.active { background: #fff; color: #1e293b; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .ra-tab .ra-tab-count { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; font-size: 10px; font-weight: 700; border-radius: 999px; padding: 0 5px; margin-left: 6px; }
    .ra-tab.active .ra-tab-count { background: #dc2626; color: #fff; }
    .ra-tab:not(.active) .ra-tab-count { background: #e2e8f0; color: #64748b; }

    /* Cards */
    .ra-card { background: #fff; border-radius: 16px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 16px; overflow: hidden; }
    .ra-card-header { padding: 20px 24px 16px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    .ra-card-body { padding: 20px 24px; }
    .ra-name { font-size: 17px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .ra-submitter { font-size: 13px; color: #64748b; }
    .ra-badge-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .ra-badge-pending   { background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 999px; display: flex; align-items: center; gap: 5px; white-space: nowrap; }
    .ra-badge-unverified{ background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 999px; display: flex; align-items: center; gap: 5px; white-space: nowrap; border: 1px solid #fde68a; }
    .ra-badge-approved  { background: #dcfce7; color: #166534; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 999px; display: flex; align-items: center; gap: 5px; white-space: nowrap; }
    .ra-badge-blocked   { background: #fee2e2; color: #991b1b; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 999px; display: flex; align-items: center; gap: 5px; white-space: nowrap; }
    .ra-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 640px) { .ra-info-grid { grid-template-columns: 1fr; } }
    .ra-info-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569; margin-bottom: 10px; }
    .ra-info-row svg { color: #94a3b8; flex-shrink: 0; }
    .ra-info-label { font-weight: 600; color: #1e293b; }
    .ra-info-link { color: #003a9b; text-decoration: none; }
    .ra-info-link:hover { text-decoration: underline; }
    .ra-email-badge-verified   { background: #dcfce7; color: #166534; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px; }
    .ra-email-badge-unverified { background: #f1f5f9; color: #64748b; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px; }
    .ra-actions { display: flex; justify-content: flex-end; align-items: center; gap: 10px; padding-top: 16px; border-top: 1px solid #f1f5f9; margin-top: 16px; flex-wrap: wrap; }
    .ra-btn { display: flex; align-items: center; gap: 7px; padding: 9px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: background 150ms, opacity 150ms; font-family: 'Inter', sans-serif; }
    .ra-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .ra-btn-approve { background: #003a9b; color: #fff; }
    .ra-btn-approve:hover:not(:disabled) { background: #002d7a; }
    .ra-btn-reject  { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
    .ra-btn-reject:hover:not(:disabled)  { background: #e2e8f0; }
    .ra-btn-block   { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
    .ra-btn-block:hover:not(:disabled)   { background: #fecaca; }
    .ra-btn-unblock { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .ra-btn-unblock:hover:not(:disabled) { background: #bbf7d0; }
    .ra-btn-remove  { background: #fff; color: #94a3b8; border: 1.5px solid #e2e8f0; }
    .ra-btn-remove:hover:not(:disabled)  { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }
    .ra-empty { text-align: center; padding: 48px 24px; color: #94a3b8; font-size: 14px; }
    .ra-block-warning { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; font-size: 13px; color: #92400e; }
    .ra-unverified-note { flex: 1; font-size: 12px; color: #92400e; background: #fef3c7; border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; gap: 6px; }
    .ra-no-results { text-align: center; padding: 40px 24px; color: #94a3b8; font-size: 14px; font-family: 'Inter', sans-serif; }
    .ra-no-results strong { display: block; font-size: 16px; color: #64748b; margin-bottom: 6px; }
`;

/* ─── Custom Confirm Modal Component ─── */
function ConfirmDialog({ modal, onClose }: { modal: ConfirmModal; onClose: () => void }) {
    if (!modal.open) return null;

    const iconColors = { danger: "#dc2626", warning: "#d97706", primary: "#003a9b" };
    const color = iconColors[modal.confirmStyle];

    const IconEl = modal.icon === "remove"
        ? <Trash2 size={24} color={color} />
        : modal.icon === "block"
            ? <ShieldOff size={24} color={color} />
            : <CheckCircle size={24} color={color} />;

    return (
        <div className="ra-overlay" onClick={onClose}>
            <div className="ra-modal" onClick={e => e.stopPropagation()}>
                <button className="ra-modal-close" onClick={onClose}><X size={14} /></button>
                <div className={`ra-modal-icon ${modal.confirmStyle}`}>{IconEl}</div>
                <h2 className="ra-modal-title">{modal.title}</h2>
                <p className="ra-modal-msg" dangerouslySetInnerHTML={{ __html: modal.message }} />
                <div className="ra-modal-actions">
                    <button className="ra-modal-cancel" onClick={onClose}>Cancel</button>
                    <button
                        className={`ra-modal-confirm ${modal.confirmStyle}`}
                        onClick={() => { modal.onConfirm(); onClose(); }}
                    >
                        {IconEl} {modal.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminRecruiterApplicationsPage() {
    const [applications, setApplications] = useState<RecruiterApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "BLOCKED">("PENDING");
    const [search, setSearch] = useState("");
    const [modal, setModal] = useState<ConfirmModal>(MODAL_CLOSED);

    useEffect(() => { fetchApplications(); }, []);

    const fetchApplications = async () => {
        try {
            const res = await fetch("/api/admin/recruiter-applications");
            if (res.ok) {
                const data = await res.json();
                setApplications(data.applications);
            }
        } catch (error) {
            console.error("Error fetching applications:", error);
        } finally {
            setLoading(false);
        }
    };

    const callAction = async (
        action: "approve" | "reject" | "block" | "unblock" | "remove",
        userId: string,
        successMsg: string
    ) => {
        setProcessing(userId);
        try {
            const res = await fetch(`/api/admin/recruiter-applications/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            if (res.ok) {
                toast.success(successMsg);
                fetchApplications();
            } else {
                const data = await res.json();
                toast.error(data.error || "Action failed");
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setProcessing(null);
        }
    };

    /* Helpers to open the modal */
    const confirmRemove = (app: RecruiterApplication) => setModal({
        open: true,
        icon: "remove",
        confirmStyle: "danger",
        title: "Remove from Recruiter List",
        message: `This will permanently remove <strong>${app.name || "this user"}</strong> from the recruiter list.<br/><span class="ra-modal-email">${app.email}</span><br/><br/>Their role will be set to <strong>Job Seeker</strong> and all company info will be cleared. They must <strong>re-apply from scratch</strong> to become a recruiter again.`,
        confirmLabel: "Remove Permanently",
        onConfirm: () => callAction("remove", app.id, `${app.email} permanently removed from recruiter list.`),
    });

    const confirmBlock = (app: RecruiterApplication) => setModal({
        open: true,
        icon: "block",
        confirmStyle: "warning",
        title: "Block Recruiter Access",
        message: `This will block <strong>${app.name || "this user"}</strong> from the recruiter dashboard.<br/><span class="ra-modal-email">${app.email}</span><br/><br/>Their role will be downgraded to <strong>Job Seeker</strong>. You can restore access later from the <strong>Blocked</strong> tab.`,
        confirmLabel: "Block Access",
        onConfirm: () => callAction("block", app.id, "Recruiter has been blocked and moved to Job Seeker."),
    });

    const confirmReject = (app: RecruiterApplication) => setModal({
        open: true,
        icon: "block",
        confirmStyle: "danger",
        title: "Reject Application",
        message: `Reject the recruiter application from <strong>${app.name || "this user"}</strong>?<br/><span class="ra-modal-email">${app.email}</span><br/><br/>They will stay as a Job Seeker and will need to re-submit.`,
        confirmLabel: "Reject Application",
        onConfirm: () => callAction("reject", app.id, "Application rejected."),
    });

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
                <Loader2 style={{ animation: "spin 1s linear infinite", width: 28, height: 28, color: "#dc2626" }} />
            </div>
        );
    }

    const pending  = applications.filter(a => a.recruiterStatus === "PENDING");
    const approved = applications.filter(a =>
        a.recruiterStatus === "APPROVED" || (a.role === "RECRUITER" && a.recruiterStatus === "NONE")
    );
    const blocked  = applications.filter(a => (a.recruiterStatus as string) === "BLOCKED");

    const tabData: Array<{ key: "PENDING" | "APPROVED" | "BLOCKED"; label: string; count: number }> = [
        { key: "PENDING",  label: "Pending",  count: pending.length  },
        { key: "APPROVED", label: "Approved", count: approved.length },
        { key: "BLOCKED",  label: "Blocked",  count: blocked.length  },
    ];

    const base = activeTab === "PENDING" ? pending : activeTab === "APPROVED" ? approved : blocked;
    const q = search.trim().toLowerCase();
    const current = q
        ? base.filter(a =>
            a.email.toLowerCase().includes(q) ||
            (a.name || "").toLowerCase().includes(q) ||
            (a.companyInfo?.companyName || "").toLowerCase().includes(q) ||
            (a.companyInfo?.companyEmail || "").toLowerCase().includes(q)
          )
        : base;

    const InfoRow = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
        <div className="ra-info-row">
            {icon}
            <span className="ra-info-label">{label}:</span>
            {children}
        </div>
    );

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

            {/* ── Professional Confirm Modal ── */}
            <ConfirmDialog modal={modal} onClose={() => setModal(MODAL_CLOSED)} />

            <div className="ra-page">
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1e293b", margin: 0 }}>Recruiter Applications</h1>
                    <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
                        Manage recruiter access — approve, reject, block, or permanently remove users from the recruiter list.
                    </p>
                </div>

                {/* Search */}
                <div className="ra-search-wrap">
                    <Search size={16} className="ra-search-icon" />
                    <input
                        className="ra-search-input"
                        placeholder="Search by email, name or company…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="ra-search-clear" onClick={() => setSearch("")}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="ra-tabs">
                    {tabData.map(tab => (
                        <button
                            key={tab.key}
                            className={`ra-tab ${activeTab === tab.key ? "active" : ""}`}
                            onClick={() => { setActiveTab(tab.key); setSearch(""); }}
                        >
                            {tab.label}
                            <span className="ra-tab-count">{tab.count}</span>
                        </button>
                    ))}
                </div>

                {/* Info banner */}
                {activeTab === "APPROVED" && approved.length > 0 && !q && (
                    <div className="ra-block-warning">
                        <AlertCircle size={16} />
                        <span><strong>Block</strong> keeps their application data and can be reversed. <strong>Remove Permanently</strong> clears all data — they must re-apply from scratch.</span>
                    </div>
                )}

                {/* No search results */}
                {q && current.length === 0 && (
                    <div className="ra-no-results">
                        <strong>No results for &ldquo;{search}&rdquo;</strong>
                        Try a different email, name, or company name.
                    </div>
                )}

                {/* Empty state */}
                {!q && current.length === 0 && (
                    <div className="ra-empty">
                        {activeTab === "PENDING"  && "No pending applications. All caught up! ✅"}
                        {activeTab === "APPROVED" && "No approved recruiters yet."}
                        {activeTab === "BLOCKED"  && "No blocked recruiters."}
                    </div>
                )}

                {/* Cards */}
                {current.length > 0 && (
                    <div>
                        {current.map((app) => (
                            <div key={app.id} className="ra-card">
                                <div className="ra-card-header">
                                    <div>
                                        <div className="ra-name">{app.companyInfo?.companyName || "Unknown Company"}</div>
                                        <div className="ra-submitter">{app.name || "—"} · {app.email}</div>
                                    </div>
                                    <div className="ra-badge-row">
                                        {activeTab === "PENDING" && (
                                            <span className="ra-badge-pending"><Clock size={13} /> Pending</span>
                                        )}
                                        {activeTab === "APPROVED" && (
                                            app.recruiterStatus === "NONE"
                                                ? <span className="ra-badge-unverified"><AlertTriangle size={13} /> Unverified</span>
                                                : <span className="ra-badge-approved"><CheckCircle size={13} /> Approved</span>
                                        )}
                                        {activeTab === "BLOCKED" && (
                                            <span className="ra-badge-blocked"><ShieldOff size={13} /> Blocked</span>
                                        )}
                                    </div>
                                </div>

                                <div className="ra-card-body">
                                    <div className="ra-info-grid">
                                        <div>
                                            {app.companyInfo?.companyEmail && (
                                                <InfoRow icon={<Mail size={15} />} label="Company Email">
                                                    <span>{app.companyInfo.companyEmail}</span>
                                                    {app.companyInfo.emailVerified
                                                        ? <span className="ra-email-badge-verified">✓ Verified</span>
                                                        : <span className="ra-email-badge-unverified">Unverified</span>
                                                    }
                                                </InfoRow>
                                            )}
                                            {app.companyInfo?.website && (
                                                <InfoRow icon={<Globe size={15} />} label="Website">
                                                    <a href={app.companyInfo.website} target="_blank" rel="noopener noreferrer" className="ra-info-link">
                                                        {app.companyInfo.website}
                                                    </a>
                                                </InfoRow>
                                            )}
                                            <InfoRow icon={<Mail size={15} />} label="User Email">
                                                <span>{app.email}</span>
                                            </InfoRow>
                                            {app.companyInfo?.size && (
                                                <InfoRow icon={<Users size={15} />} label="Company Size">
                                                    <span>{app.companyInfo.size}</span>
                                                </InfoRow>
                                            )}
                                        </div>
                                        {app.companyInfo?.description && (
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>Description</div>
                                                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                                                    {app.companyInfo.description}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Action Buttons ── */}
                                    <div className="ra-actions">

                                        {/* PENDING */}
                                        {activeTab === "PENDING" && (
                                            <>
                                                <button className="ra-btn ra-btn-remove" disabled={processing === app.id}
                                                    onClick={() => confirmRemove(app)}>
                                                    {processing === app.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                    Remove
                                                </button>
                                                <button className="ra-btn ra-btn-reject" disabled={processing === app.id}
                                                    onClick={() => confirmReject(app)}>
                                                    {processing === app.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                                    Reject
                                                </button>
                                                <button className="ra-btn ra-btn-approve" disabled={processing === app.id}
                                                    onClick={() => callAction("approve", app.id, "Application approved! User is now a recruiter.")}>
                                                    {processing === app.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                                    Approve
                                                </button>
                                            </>
                                        )}

                                        {/* APPROVED */}
                                        {activeTab === "APPROVED" && (
                                            <>
                                                {app.recruiterStatus === "NONE" && (
                                                    <div className="ra-unverified-note">
                                                        <AlertTriangle size={13} />
                                                        Never formally approved — locked out until approved.
                                                    </div>
                                                )}
                                                {app.recruiterStatus === "NONE" && (
                                                    <button className="ra-btn ra-btn-approve" disabled={processing === app.id}
                                                        onClick={() => callAction("approve", app.id, "User formally approved as Recruiter!")}>
                                                        {processing === app.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                                        Formally Approve
                                                    </button>
                                                )}
                                                <button className="ra-btn ra-btn-remove" disabled={processing === app.id}
                                                    onClick={() => confirmRemove(app)}>
                                                    {processing === app.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                    Remove Permanently
                                                </button>
                                                <button className="ra-btn ra-btn-block" disabled={processing === app.id}
                                                    onClick={() => confirmBlock(app)}>
                                                    {processing === app.id ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />}
                                                    Block
                                                </button>
                                            </>
                                        )}

                                        {/* BLOCKED */}
                                        {activeTab === "BLOCKED" && (
                                            <>
                                                <button className="ra-btn ra-btn-remove" disabled={processing === app.id}
                                                    onClick={() => confirmRemove(app)}>
                                                    {processing === app.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                    Remove Permanently
                                                </button>
                                                <button className="ra-btn ra-btn-unblock" disabled={processing === app.id}
                                                    onClick={() => callAction("unblock", app.id, "Recruiter access restored. User can now switch back to Recruiter.")}>
                                                    {processing === app.id ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                                    Restore Access
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
