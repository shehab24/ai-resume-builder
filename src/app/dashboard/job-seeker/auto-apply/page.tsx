"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Sparkles, Chrome, CheckCircle2, XCircle, Clock, Zap, RefreshCw,
    ToggleLeft, ToggleRight, Globe, Target, Play, ExternalLink,
    Download, Wifi, WifiOff, ChevronRight, AlertCircle, BarChart3,
    Linkedin, Building2, Search, BookOpen
} from "lucide-react";

interface ExternalApp {
    id: string;
    jobTitle: string;
    company?: string;
    jobUrl: string;
    platform?: string;
    status: string;
    appliedAt: string;
}

interface UserSettings {
    autoApply: boolean;
    matchThreshold: number;
    autoApplyCountry: string;
    extensionConnectedAt?: string;
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
    linkedin: <Linkedin size={14} />,
    indeed: <Search size={14} />,
    glassdoor: <Building2 size={14} />,
    bdjobs: <BookOpen size={14} />,
};

const PLATFORM_COLORS: Record<string, string> = {
    linkedin: "#0077b5",
    indeed: "#003a9b",
    glassdoor: "#0caa41",
    bdjobs: "#e63946",
};

export default function AutoApplyPage() {
    const [activeTab, setActiveTab] = useState<"internal" | "external">("internal");
    const [settings, setSettings] = useState<UserSettings>({
        autoApply: false,
        matchThreshold: 80,
        autoApplyCountry: "",
    });
    const [externalApps, setExternalApps] = useState<ExternalApp[]>([]);
    const [cronStats, setCronStats] = useState<{ jobsProcessed: number; applicationsCreated: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [running, setRunning] = useState(false);
    const [extensionConnected, setExtensionConnected] = useState(false);
    const [extensionInstalledLocal, setExtensionInstalledLocal] = useState(false);
    const [extensionAuthenticated, setExtensionAuthenticated] = useState(false);
    const [connectingExt, setConnectingExt] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [profileRes, logsRes] = await Promise.all([
                fetch("/api/user/profile"),
                fetch("/api/extension/log"),
            ]);
            if (profileRes.ok) {
                const d = await profileRes.json();
                setSettings({
                    autoApply: d.autoApply ?? false,
                    matchThreshold: d.matchThreshold ?? 80,
                    autoApplyCountry: d.autoApplyCountry ?? "",
                    extensionConnectedAt: d.extensionConnectedAt,
                });
                setExtensionConnected(!!d.extensionConnectedAt && !!d.extensionToken);
            }
            if (logsRes.ok) {
                setExternalApps(await logsRes.json());
            }
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 300);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

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

    const saveSettings = async (patch: Partial<UserSettings>) => {
        setSaving(true);
        const updated = { ...settings, ...patch };
        setSettings(updated);
        await fetch("/api/user/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                autoApply: updated.autoApply,
                matchThreshold: updated.matchThreshold,
                autoApplyCountry: updated.autoApplyCountry || null,
            }),
        });
        setSaving(false);
    };

    const runNow = async () => {
        setRunning(true);
        try {
            const res = await fetch("/api/cron/auto-apply");
            if (res.ok) setCronStats(await res.json());
        } finally {
            setRunning(false);
        }
    };

    const connectExtension = () => {
        setConnectingExt(true);
        const authUrl = `${window.location.origin}/extension/auth`;
        const popup = window.open(authUrl, "talentflow-ext-auth", "width=520,height=680,left=200,top=100");
        // Poll until the popup closes (auth succeeded)
        const poll = setInterval(() => {
            if (popup?.closed) {
                clearInterval(poll);
                setConnectingExt(false);
                fetchData(); // Refresh to check connection status
            }
        }, 800);
    };

    const disconnectExtension = async () => {
        await fetch("/api/extension/token", { method: "DELETE" });
        window.postMessage({ type: "TALENTFLOW_LOGOUT" }, "*");
        setExtensionConnected(false);
        setSettings(s => ({ ...s, extensionConnectedAt: undefined }));
    };

    if (loading) {
        return (
            <div style={S.loadWrap}>
                <div style={S.spinner} />
                <p style={{ color: "#64748b", fontSize: 14 }}>Loading Auto-Apply settings…</p>
            </div>
        );
    }

    return (
        <div style={S.page}>
            <style>{css}</style>

            {/* ── Header ── */}
            <div style={S.pageHeader}>
                <div>
                    <div style={S.badge}><Sparkles size={13} /> Auto-Apply</div>
                    <h1 style={S.h1}>Auto-Apply Center</h1>
                    <p style={S.lead}>Let TalentFlow apply to jobs automatically — internally via AI matching, or externally via our Chrome Extension.</p>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div style={S.tabBar}>
                <button
                    style={{ ...S.tab, ...(activeTab === "internal" ? S.tabActive : {}) }}
                    onClick={() => setActiveTab("internal")}
                >
                    <Zap size={16} /> Internal Auto-Apply
                </button>
                <button
                    style={{ ...S.tab, ...(activeTab === "external" ? S.tabActive : {}) }}
                    onClick={() => setActiveTab("external")}
                >
                    <Chrome size={16} /> External (Chrome Extension)
                    {extensionInstalledLocal && extensionAuthenticated && <span style={S.dot} />}
                </button>
            </div>

            {/* ══════════ INTERNAL TAB ══════════ */}
            {activeTab === "internal" && (
                <div style={S.grid}>
                    {/* Left column */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Toggle card */}
                        <div style={S.card}>
                            <div style={S.cardHead}>
                                <div>
                                    <h2 style={S.cardTitle}>Internal Auto-Apply</h2>
                                    <p style={S.cardSub}>Automatically apply to platform jobs that match your resume when new listings are posted.</p>
                                </div>
                                <button
                                    onClick={() => saveSettings({ autoApply: !settings.autoApply })}
                                    style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
                                >
                                    {settings.autoApply
                                        ? <ToggleRight size={44} color="#003a9b" />
                                        : <ToggleLeft size={44} color="#94a3b8" />}
                                </button>
                            </div>
                            <div style={{ ...S.statusPill, background: settings.autoApply ? "#dcfce7" : "#f1f5f9", color: settings.autoApply ? "#166534" : "#64748b" }}>
                                {settings.autoApply ? <><CheckCircle2 size={13} /> Active — scanning for matching jobs</> : <><XCircle size={13} /> Disabled</>}
                            </div>
                        </div>

                        {/* Threshold */}
                        <div style={S.card}>
                            <h2 style={S.cardTitle}><Target size={16} style={{ verticalAlign: -3 }} /> Match Threshold</h2>
                            <p style={S.cardSub}>Only auto-apply when your resume matches a job by at least this percentage.</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
                                <input
                                    type="range" min={50} max={100} step={5}
                                    value={settings.matchThreshold}
                                    onChange={e => setSettings(s => ({ ...s, matchThreshold: +e.target.value }))}
                                    onMouseUp={() => saveSettings({})}
                                    style={{ flex: 1, accentColor: "#003a9b", height: 6 }}
                                />
                                <span style={S.thresholdBadge}>{settings.matchThreshold}%</span>
                            </div>
                            <div style={S.thresholdHints}>
                                <span>50% — Broad</span><span>75% — Balanced</span><span>100% — Exact</span>
                            </div>
                        </div>

                        {/* Country */}
                        <div style={S.card}>
                            <h2 style={S.cardTitle}><Globe size={16} style={{ verticalAlign: -3 }} /> Country Filter</h2>
                            <p style={S.cardSub}>Leave blank to apply to all countries, or enter one to restrict matches.</p>
                            <input
                                type="text"
                                placeholder="e.g. Bangladesh, USA, Remote…"
                                value={settings.autoApplyCountry}
                                onChange={e => setSettings(s => ({ ...s, autoApplyCountry: e.target.value }))}
                                onBlur={() => saveSettings({})}
                                style={S.input}
                            />
                        </div>
                    </div>

                    {/* Right column */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Run Now */}
                        <div style={S.card}>
                            <h2 style={S.cardTitle}><Play size={16} style={{ verticalAlign: -3 }} /> Manual Run</h2>
                            <p style={S.cardSub}>Trigger the auto-apply engine right now instead of waiting for the daily cron.</p>
                            <button
                                onClick={runNow}
                                disabled={running}
                                style={{ ...S.primaryBtn, marginTop: 12, opacity: running ? 0.7 : 1 }}
                            >
                                {running ? <><RefreshCw size={15} className="spin" /> Running…</> : <><Play size={15} /> Run Auto-Apply Now</>}
                            </button>

                            {cronStats && (
                                <div style={S.statsRow}>
                                    <div style={S.statBox}>
                                        <span style={S.statNum}>{cronStats.jobsProcessed}</span>
                                        <span style={S.statLbl}>Jobs Scanned</span>
                                    </div>
                                    <div style={S.statBox}>
                                        <span style={{ ...S.statNum, color: "#003a9b" }}>{cronStats.applicationsCreated}</span>
                                        <span style={S.statLbl}>Applied</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* How it works */}
                        <div style={{ ...S.card, background: "linear-gradient(135deg, #eef2ff, #f8fafc)" }}>
                            <h2 style={S.cardTitle}><BarChart3 size={16} style={{ verticalAlign: -3 }} /> How It Works</h2>
                            {[
                                ["1", "Daily cron scans new internal job postings"],
                                ["2", "AI scores your resume against each job's requirements"],
                                ["3", "If score ≥ threshold, it auto-submits your application"],
                                ["4", "You get a notification for every auto-application"],
                            ].map(([n, text]) => (
                                <div key={n} style={S.step}>
                                    <span style={S.stepNum}>{n}</span>
                                    <span style={{ fontSize: 13, color: "#475569" }}>{text}</span>
                                </div>
                            ))}
                        </div>

                        {saving && (
                            <div style={S.savingPill}><RefreshCw size={12} className="spin" /> Saving settings…</div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════ EXTERNAL TAB ══════════ */}
            {activeTab === "external" && (
                <div style={S.grid}>
                    {/* Left column */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Connection Status */}
                        <div style={{
                            ...S.card,
                            border: !extensionInstalledLocal
                                ? "1.5px solid #e2e8f0"
                                : !extensionAuthenticated
                                ? "2px solid #38bdf8"
                                : "2px solid #86efac"
                        }}>
                            <div style={S.cardHead}>
                                <div>
                                    <h2 style={S.cardTitle}>Extension Status</h2>
                                    <p style={S.cardSub}>
                                        {!extensionInstalledLocal
                                            ? "Please download and install the TalentFlow extension on this browser first."
                                            : !extensionAuthenticated
                                            ? "Extension is installed! Click below to link your TalentFlow account."
                                            : `Connected since ${settings.extensionConnectedAt ? new Date(settings.extensionConnectedAt).toLocaleDateString() : new Date().toLocaleDateString()}`}
                                    </p>
                                </div>
                                {!extensionInstalledLocal ? (
                                    <WifiOff size={28} color="#94a3b8" />
                                ) : !extensionAuthenticated ? (
                                    <Chrome size={28} color="#003a9b" />
                                ) : (
                                    <Wifi size={28} color="#22c55e" />
                                )}
                            </div>

                            {!extensionInstalledLocal ? (
                                <div style={{ marginTop: 12 }}>
                                    <button
                                        disabled
                                        style={{
                                            ...S.primaryBtn,
                                            background: "#f1f5f9",
                                            color: "#94a3b8",
                                            cursor: "not-allowed",
                                            border: "1px solid #e2e8f0"
                                        }}
                                    >
                                        Connect Account (Install Extension First)
                                    </button>
                                </div>
                            ) : !extensionAuthenticated ? (
                                <button
                                    onClick={connectExtension}
                                    disabled={connectingExt}
                                    style={{ ...S.primaryBtn, marginTop: 12 }}
                                >
                                    {connectingExt
                                        ? <><RefreshCw size={15} className="spin" /> Waiting for login…</>
                                        : <><Zap size={15} /> Connect Account</>}
                                </button>
                            ) : (
                                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                                    <div style={{ ...S.statusPill, background: "#dcfce7", color: "#166534", flex: 1, justifyContent: "center" }}>
                                        <CheckCircle2 size={13} /> Connected & Active
                                    </div>
                                    <button onClick={disconnectExtension} style={S.ghostBtn}>Disconnect</button>
                                </div>
                            )}
                        </div>

                        {/* Install Guide */}
                        <div style={S.card}>
                            <h2 style={S.cardTitle}><Download size={16} style={{ verticalAlign: -3 }} /> Install Extension</h2>
                            <p style={S.cardSub}>Install the TalentFlow Chrome Extension to auto-apply on external job sites.</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                                {[
                                    ["1", "Download the extension .zip file below"],
                                    ["2", "Open Chrome → chrome://extensions"],
                                    ["3", 'Enable "Developer mode" (top right toggle)'],
                                    ["4", 'Click "Load unpacked" and select the unzipped folder'],
                                    ["5", 'Click "Connect Account" above to link your TalentFlow account'],
                                ].map(([n, text]) => (
                                    <div key={n} style={S.step}>
                                        <span style={S.stepNum}>{n}</span>
                                        <span style={{ fontSize: 13, color: "#475569" }}>{text}</span>
                                    </div>
                                ))}
                            </div>
                            <a
                                href="/talentflow-extension.zip"
                                download
                                style={{ ...S.primaryBtn, marginTop: 16, textDecoration: "none", display: "inline-flex" }}
                            >
                                <Download size={15} /> Download Extension (.zip)
                            </a>
                        </div>
                    </div>

                    {/* Right column */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Supported Sites */}
                        <div style={S.card}>
                            <h2 style={S.cardTitle}>Supported Job Sites</h2>
                            <p style={S.cardSub}>The extension auto-fills and submits applications on these platforms.</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                                {[
                                    { key: "linkedin", name: "LinkedIn", desc: "Easy Apply jobs" },
                                    { key: "indeed", name: "Indeed", desc: "Quick Apply jobs" },
                                    { key: "glassdoor", name: "Glassdoor", desc: "Easy Apply jobs" },
                                    { key: "bdjobs", name: "Bdjobs.com", desc: "All job applications" },
                                ].map(site => (
                                    <div key={site.key} style={S.siteRow}>
                                        <div style={{ ...S.siteIcon, background: PLATFORM_COLORS[site.key] + "18", color: PLATFORM_COLORS[site.key] }}>
                                            {PLATFORM_ICONS[site.key]}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{site.name}</div>
                                            <div style={{ fontSize: 12, color: "#94a3b8" }}>{site.desc}</div>
                                        </div>
                                        <span style={{ ...S.statusPill, background: "#dcfce7", color: "#166534", padding: "2px 10px", fontSize: 11 }}>
                                            <CheckCircle2 size={11} /> Active
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* External Applications Log */}
                        <div style={S.card}>
                            <div style={S.cardHead}>
                                <h2 style={S.cardTitle}>External Applications</h2>
                                <span style={{ fontSize: 12, color: "#94a3b8" }}>{externalApps.length} total</span>
                            </div>
                            {externalApps.length === 0 ? (
                                <div style={S.empty}>
                                    <AlertCircle size={28} color="#cbd5e1" />
                                    <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>No external applications yet.<br />Install the extension and start applying!</p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, maxHeight: 340, overflowY: "auto" }}>
                                    {externalApps.map(app => (
                                        <div key={app.id} style={S.appRow}>
                                            <div style={{ ...S.siteIcon, background: PLATFORM_COLORS[app.platform ?? ""] + "18" || "#f1f5f9", color: PLATFORM_COLORS[app.platform ?? ""] || "#64748b" }}>
                                                {PLATFORM_ICONS[app.platform ?? ""] ?? <Globe size={14} />}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{app.jobTitle}</div>
                                                <div style={{ fontSize: 11, color: "#94a3b8" }}>{app.company} · {new Date(app.appliedAt).toLocaleDateString()}</div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <span style={{ ...S.statusPill, padding: "2px 8px", fontSize: 11, background: app.status === "APPLIED" ? "#dcfce7" : "#fef2f2", color: app.status === "APPLIED" ? "#166534" : "#dc2626" }}>
                                                    {app.status === "APPLIED" ? <CheckCircle2 size={11} /> : <XCircle size={11} />} {app.status}
                                                </span>
                                                <a href={app.jobUrl} target="_blank" rel="noreferrer" style={{ color: "#94a3b8" }}><ExternalLink size={13} /></a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* How Extension Works */}
                        <div style={{ ...S.card, background: "linear-gradient(135deg, #eef2ff, #f8fafc)" }}>
                            <h2 style={S.cardTitle}>How the Extension Works</h2>
                            {[
                                ["1", "Navigate to a job on LinkedIn, Indeed, Glassdoor, or Bdjobs"],
                                ["2", "Click the TalentFlow button in your browser toolbar"],
                                ["3", 'Press "Auto Apply" — extension fills the form and submits'],
                                ["4", "Application is logged here automatically"],
                            ].map(([n, text]) => (
                                <div key={n} style={S.step}>
                                    <span style={S.stepNum}>{n}</span>
                                    <span style={{ fontSize: 13, color: "#475569" }}>{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; }
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
`;

const S: Record<string, React.CSSProperties> = {
    page: { fontFamily: "'Inter', sans-serif", maxWidth: 1100, margin: "0 auto", padding: "8px 0 40px" },
    loadWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 },
    spinner: { width: 36, height: 36, border: "3px solid #e2e8f0", borderTop: "3px solid #003a9b", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

    pageHeader: { marginBottom: 24 },
    badge: { display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "linear-gradient(135deg,#eef2ff,#dbeafe)", color: "#003a9b", borderRadius: 999, fontSize: 12, fontWeight: 600, marginBottom: 10 },
    h1: { fontSize: 26, fontWeight: 700, color: "#1e293b", margin: "0 0 6px", letterSpacing: "-0.4px" },
    lead: { fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.6 },

    tabBar: { display: "flex", gap: 8, marginBottom: 24, borderBottom: "2px solid #f1f5f9", paddingBottom: 0 },
    tab: { display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", border: "none", background: "transparent", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#64748b", borderBottom: "2px solid transparent", marginBottom: -2, borderRadius: "8px 8px 0 0", transition: "all 150ms", position: "relative" },
    tabActive: { color: "#003a9b", borderBottomColor: "#003a9b", background: "#eef2ff" },
    dot: { position: "absolute", top: 8, right: 8, width: 7, height: 7, background: "#22c55e", borderRadius: "50%", border: "1.5px solid #fff" },

    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" },

    card: { background: "#fff", borderRadius: 16, padding: "20px 22px", border: "1.5px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" },
    cardHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 },
    cardTitle: { fontSize: 15, fontWeight: 700, color: "#1e293b", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6 },
    cardSub: { fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 },

    statusPill: { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600 },
    thresholdBadge: { background: "#003a9b", color: "#fff", borderRadius: 8, padding: "4px 12px", fontWeight: 700, fontSize: 15, minWidth: 54, textAlign: "center" },
    thresholdHints: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 6 },
    input: { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", fontFamily: "inherit", marginTop: 10, color: "#1e293b" },

    primaryBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 22px", background: "linear-gradient(135deg, #003a9b, #0055e9)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit", width: "100%", transition: "opacity 150ms" },
    ghostBtn: { padding: "8px 16px", background: "none", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#64748b", fontFamily: "inherit" },

    statsRow: { display: "flex", gap: 12, marginTop: 14 },
    statBox: { flex: 1, background: "#f8fafc", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 2 },
    statNum: { fontSize: 26, fontWeight: 700, color: "#1e293b", lineHeight: 1 },
    statLbl: { fontSize: 11, color: "#94a3b8", fontWeight: 500 },

    step: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9" },
    stepNum: { width: 22, height: 22, borderRadius: 6, background: "#003a9b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 },

    siteRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#f8fafc", borderRadius: 10 },
    siteIcon: { width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },

    appRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#f8fafc", borderRadius: 10 },
    empty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "32px 0", color: "#94a3b8" },

    savingPill: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", background: "#f1f5f9", padding: "6px 12px", borderRadius: 999 },

    chev: { color: "#94a3b8" },
};
