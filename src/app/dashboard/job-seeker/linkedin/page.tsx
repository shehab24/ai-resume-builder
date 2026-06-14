"use client";

import { useEffect, useState } from "react";
import {
    Linkedin, CheckCircle2, AlertCircle, ExternalLink, Trash2,
    Loader2, Link2, Sparkles, Shield, Bot, Zap, ChevronRight,
    RefreshCw, Globe,
} from "lucide-react";
import { toast } from "sonner";

/* ── Styles ──────────────────────────────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.li-wrap { font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 32px 24px; }

/* header */
.li-header { margin-bottom: 32px; }
.li-title-row { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
.li-icon-wrap {
    width: 48px; height: 48px; border-radius: 14px;
    background: linear-gradient(135deg, #0077b5 0%, #005885 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 14px rgba(0,119,181,0.3);
}
.li-title { font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; }
.li-sub { font-size: 14px; color: #64748b; line-height: 1.6; max-width: 560px; }

/* status banner */
.li-status-banner {
    display: flex; align-items: center; gap: 14px;
    border-radius: 14px; padding: 16px 20px; margin-bottom: 28px;
    border: 1px solid;
}
.li-status-banner.connected {
    background: #f0fdf4; border-color: #bbf7d0;
}
.li-status-banner.disconnected {
    background: #fefce8; border-color: #fde68a;
}

/* main card */
.li-card {
    background: #fff; border: 1px solid #e2e8f0;
    border-radius: 16px; padding: 28px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    margin-bottom: 20px;
}
.li-card-title {
    font-size: 15px; font-weight: 700; color: #0f172a;
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 6px;
}
.li-card-sub { font-size: 13px; color: #64748b; margin-bottom: 20px; line-height: 1.6; }

/* URL input */
.li-input-wrap { position: relative; }
.li-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
.li-input {
    width: 100%; padding: 13px 14px 13px 42px;
    border: 1.5px solid #e2e8f0; border-radius: 10px;
    font-size: 14px; font-family: 'Inter', sans-serif; color: #1e293b;
    outline: none; transition: border 150ms;
    box-sizing: border-box;
}
.li-input:focus { border-color: #0077b5; }
.li-input::placeholder { color: #94a3b8; }

/* buttons */
.li-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 20px; border-radius: 10px; border: none;
    font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif;
    cursor: pointer; transition: all 150ms; white-space: nowrap;
}
.li-btn.primary { background: #0077b5; color: #fff; }
.li-btn.primary:hover { background: #005885; }
.li-btn.primary:disabled { opacity: 0.6; cursor: not-allowed; }
.li-btn.danger { background: #fff; color: #dc2626; border: 1.5px solid #fecaca; }
.li-btn.danger:hover { background: #fef2f2; }
.li-btn.outline { background: #fff; color: #003a9b; border: 1.5px solid #c7d6f5; }
.li-btn.outline:hover { background: #eef2ff; }

/* divider */
.li-divider { height: 1px; background: #f1f5f9; margin: 20px 0; }

/* benefit cards */
.li-benefits { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 24px; }
.li-benefit {
    background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 12px; padding: 16px 18px;
    display: flex; gap: 12px; align-items: flex-start;
}
.li-benefit-icon {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.li-benefit-title { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
.li-benefit-sub { font-size: 12px; color: #64748b; line-height: 1.5; }

/* steps */
.li-steps { display: flex; flex-direction: column; gap: 12px; }
.li-step {
    display: flex; gap: 12px; align-items: flex-start;
    padding: 14px 16px; background: #f8fafc; border-radius: 10px;
    border: 1px solid #e2e8f0;
}
.li-step-num {
    width: 26px; height: 26px; border-radius: 50%;
    background: #003a9b; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.li-step-title { font-size: 13px; font-weight: 600; color: #0f172a; }
.li-step-sub { font-size: 12px; color: #64748b; margin-top: 2px; line-height: 1.5; }

/* extension warning box */
.li-warn {
    background: #fffbeb; border: 1px solid #fde68a;
    border-radius: 12px; padding: 14px 18px;
    display: flex; gap: 12px; align-items: flex-start;
    font-size: 13px; color: #92400e;
}

@media (max-width: 600px) {
    .li-benefits { grid-template-columns: 1fr; }
}
`;

const BENEFITS = [
    {
        icon: <Bot size={18} color="#7c3aed" />,
        bg: "#f3e8ff",
        title: "Smarter Auto-Apply",
        sub: "The extension uses your LinkedIn identity to apply on LinkedIn jobs with zero friction.",
    },
    {
        icon: <Zap size={18} color="#d97706" />,
        bg: "#fffbeb",
        title: "Instant Profile Fill",
        sub: "Your LinkedIn URL is auto-filled on any application form that asks for it.",
    },
    {
        icon: <Shield size={18} color="#16a34a" />,
        bg: "#f0fdf4",
        title: "Secure — No Password",
        sub: "We only store your public profile URL. Credentials stay in your browser only.",
    },
    {
        icon: <Globe size={18} color="#0077b5" />,
        bg: "#e0f2fe",
        title: "Cross-Platform",
        sub: "Works on LinkedIn, Indeed, Glassdoor and any form asking for a LinkedIn link.",
    },
];

const STEPS = [
    {
        title: "Open LinkedIn in your browser",
        sub: "Go to linkedin.com and navigate to your own profile page.",
    },
    {
        title: "Copy your profile URL",
        sub: 'It looks like: https://www.linkedin.com/in/your-name. Click the address bar and copy it.',
    },
    {
        title: "Paste it below and click Connect",
        sub: "That's it! The TalentFlow extension will use it when auto-applying.",
    },
];

export default function LinkedInPage() {
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [savedUrl, setSavedUrl] = useState<string | null>(null);
    const [connectedAt, setConnectedAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [connectingOneClick, setConnectingOneClick] = useState(false);
    const [showManual, setShowManual] = useState(false);

    // Extension detection
    const [extInstalled, setExtInstalled] = useState(false);
    const [extAuthed, setExtAuthed] = useState(false);

    useEffect(() => {
        fetch("/api/user/linkedin")
            .then(r => r.json())
            .then(d => {
                if (d.linkedinProfileUrl) {
                    setSavedUrl(d.linkedinProfileUrl);
                    setLinkedinUrl(d.linkedinProfileUrl);
                    setConnectedAt(d.linkedinConnectedAt);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Ping extension and listen for replies
    useEffect(() => {
        const handle = (e: MessageEvent) => {
            if (e.data?.type === "TALENTFLOW_PONG") {
                setExtInstalled(true);
                setExtAuthed(!!e.data.authenticated);
            }
            if (e.data?.type === "TALENTFLOW_CONNECT_LINKEDIN_RESP") {
                setConnectingOneClick(false);
                if (e.data.success && e.data.profileUrl) {
                    // Save to backend
                    saveProfileUrl(e.data.profileUrl);
                } else {
                    toast.error(e.data.error || "Could not retrieve LinkedIn profile automatically.");
                    setShowManual(true);
                }
            }
        };
        window.addEventListener("message", handle);
        const id = setInterval(() => window.postMessage({ type: "TALENTFLOW_PING" }, "*"), 1500);
        window.postMessage({ type: "TALENTFLOW_PING" }, "*");
        return () => { window.removeEventListener("message", handle); clearInterval(id); };
    }, []);

    const saveProfileUrl = async (url: string) => {
        setSaving(true);
        try {
            const res = await fetch("/api/user/linkedin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ linkedinProfileUrl: url }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error);
            setSavedUrl(d.linkedinProfileUrl);
            setLinkedinUrl(d.linkedinProfileUrl);
            setConnectedAt(d.linkedinConnectedAt);
            toast.success("LinkedIn profile connected successfully! 🎉");
        } catch (e: any) {
            toast.error(e.message || "Failed to save LinkedIn connection.");
        } finally {
            setSaving(false);
        }
    };

    const handleOneClickConnect = () => {
        if (!extInstalled) {
            toast.error("Please install the TalentFlow Chrome extension first to connect automatically.");
            setShowManual(true);
            return;
        }
        setConnectingOneClick(true);
        window.postMessage({ type: "TALENTFLOW_CONNECT_LINKEDIN_REQ" }, "*");

        // 8-second timeout if extension is not reloaded or fails to find profile
        setTimeout(() => {
            setConnectingOneClick(prev => {
                if (prev) {
                    toast.error("Connection timed out. Please reload the TalentFlow extension in chrome://extensions and try again, or enter your URL manually.");
                    setShowManual(true);
                    return false;
                }
                return prev;
            });
        }, 8000);
    };

    const handleSave = async () => {
        if (!linkedinUrl.trim()) { toast.error("Please enter your LinkedIn profile URL"); return; }
        if (!linkedinUrl.includes("linkedin.com")) { toast.error("That doesn't look like a LinkedIn URL"); return; }
        await saveProfileUrl(linkedinUrl.trim());
    };

    const handleDisconnect = async () => {
        setDisconnecting(true);
        try {
            const res = await fetch("/api/user/linkedin", { method: "DELETE" });
            if (!res.ok) throw new Error("Failed");
            setSavedUrl(null);
            setLinkedinUrl("");
            setConnectedAt(null);
            toast.success("LinkedIn disconnected");
        } catch {
            toast.error("Failed to disconnect");
        } finally {
            setDisconnecting(false);
        }
    };

    if (loading) {
        return (
            <div className="li-wrap">
                <style dangerouslySetInnerHTML={{ __html: css }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12, color: "#64748b", fontSize: 14, fontFamily: "Inter, sans-serif" }}>
                    <Loader2 size={22} className="animate-spin" /> Loading…
                </div>
            </div>
        );
    }

    const isConnected = !!savedUrl;

    return (
        <div className="li-wrap">
            <style dangerouslySetInnerHTML={{ __html: css }} />

            {/* Header */}
            <div className="li-header">
                <div className="li-title-row">
                    <div className="li-icon-wrap">
                        <Linkedin size={24} color="#fff" />
                    </div>
                    <h1 className="li-title">LinkedIn Integration</h1>
                </div>
                <p className="li-sub">
                    Connect your LinkedIn profile so TalentFlow's auto-apply extension knows who you are
                    — enabling smarter applications on LinkedIn and across the web.
                </p>
            </div>

            {/* Status Banner */}
            <div className={`li-status-banner ${isConnected ? "connected" : "disconnected"}`}>
                {isConnected ? (
                    <>
                        <CheckCircle2 size={22} color="#16a34a" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}>LinkedIn Connected</div>
                            <div style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>
                                {savedUrl}
                                {connectedAt && ` · Connected ${new Date(connectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                            </div>
                        </div>
                        <a
                            href={savedUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="li-btn outline"
                            style={{ textDecoration: "none", fontSize: 12, padding: "7px 14px" }}
                        >
                            <ExternalLink size={13} /> View
                        </a>
                    </>
                ) : (
                    <>
                        <AlertCircle size={22} color="#d97706" style={{ flexShrink: 0 }} />
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>Not Connected</div>
                            <div style={{ fontSize: 12, color: "#92400e", marginTop: 2 }}>
                                Add your LinkedIn profile URL below to enable smart auto-apply on LinkedIn jobs.
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Extension status note */}
            {!extInstalled && (
                <div className="li-warn" style={{ marginBottom: 20 }}>
                    <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                        <strong>TalentFlow Extension not detected.</strong> Install and link the extension to use LinkedIn auto-apply.{" "}
                        <a href="/dashboard/job-seeker/auto-apply" style={{ color: "#0077b5", fontWeight: 600 }}>
                            Set it up →
                        </a>
                    </div>
                </div>
            )}

            {/* One-Click Connect Card */}
            {!isConnected && (
                <div className="li-card" style={{
                    background: "linear-gradient(135deg, #ffffff 0%, #f4f9fc 100%)",
                    border: "1.5px solid #bde0f5",
                    boxShadow: "0 4px 20px rgba(0, 119, 181, 0.08)",
                    position: "relative",
                    overflow: "hidden"
                }}>
                    <div style={{
                        position: "absolute",
                        top: -20,
                        right: -20,
                        width: 120,
                        height: 120,
                        borderRadius: "50%",
                        background: "rgba(0, 119, 181, 0.04)",
                        pointerEvents: "none"
                    }} />

                    <div className="li-card-title" style={{ fontSize: "17px", gap: "10px" }}>
                        <Sparkles size={18} color="#0077b5" />
                        One-Click Extension Connection
                    </div>
                    <p className="li-card-sub" style={{ fontSize: "14px", color: "#475569" }}>
                        TalentFlow can retrieve your logged-in LinkedIn profile automatically via the browser extension. No typing or passwords required!
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                        <div>
                            <button
                                className="li-btn primary"
                                onClick={handleOneClickConnect}
                                disabled={connectingOneClick || saving}
                                style={{
                                    fontSize: "15px",
                                    padding: "14px 28px",
                                    boxShadow: "0 4px 12px rgba(0, 119, 181, 0.2)",
                                    background: "linear-gradient(135deg, #0077b5 0%, #005f91 100%)"
                                }}
                            >
                                {connectingOneClick ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Detecting Profile...
                                    </>
                                ) : (
                                    <>
                                        <Linkedin size={18} />
                                        Connect with LinkedIn
                                    </>
                                )}
                            </button>
                        </div>

                        {!extInstalled && (
                            <div style={{ fontSize: "12px", color: "#b45309", display: "flex", alignItems: "center", gap: "6px" }}>
                                <AlertCircle size={14} />
                                Extension not detected. Will search for it when clicking connect.
                            </div>
                        )}

                        <div style={{ marginTop: "10px" }}>
                            <button
                                onClick={() => setShowManual(!showManual)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#475569",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    textDecoration: "underline",
                                    cursor: "pointer",
                                    padding: 0
                                }}
                            >
                                {showManual ? "Hide manual entry" : "Or enter profile URL manually"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Edit Card (Always shown when connected to allow updating/disconnecting, or shown if showManual is true) */}
            {(isConnected || showManual) && (
                <div className="li-card">
                    <div className="li-card-title">
                        <Link2 size={17} color="#0077b5" />
                        {isConnected ? "Connected LinkedIn Profile" : "Enter LinkedIn Profile URL Manually"}
                    </div>
                    <p className="li-card-sub">
                        Paste your public LinkedIn profile URL (e.g.{" "}
                        <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>
                            https://www.linkedin.com/in/your-name
                        </code>
                        ).
                    </p>

                    <div className="li-input-wrap" style={{ marginBottom: 16 }}>
                        <Globe size={16} className="li-input-icon" />
                        <input
                            className="li-input"
                            type="url"
                            placeholder="https://www.linkedin.com/in/your-name"
                            value={linkedinUrl}
                            onChange={e => setLinkedinUrl(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSave()}
                        />
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button className="li-btn primary" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <Linkedin size={15} />}
                            {saving ? "Saving..." : isConnected ? "Update Connection" : "Connect Manually"}
                        </button>

                        {isConnected && (
                            <button className="li-btn danger" onClick={handleDisconnect} disabled={disconnecting}>
                                {disconnecting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                {disconnecting ? "Disconnect" : "Disconnect"}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Benefits */}
            <div className="li-card">
                <div className="li-card-title">
                    <Sparkles size={17} color="#7c3aed" />
                    Why connect LinkedIn?
                </div>
                <p className="li-card-sub">
                    Linking your profile unlocks several automation benefits across the TalentFlow platform.
                </p>
                <div className="li-benefits">
                    {BENEFITS.map((b, i) => (
                        <div key={i} className="li-benefit">
                            <div className="li-benefit-icon" style={{ background: b.bg }}>
                                {b.icon}
                            </div>
                            <div>
                                <div className="li-benefit-title">{b.title}</div>
                                <div className="li-benefit-sub">{b.sub}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* How to find your URL */}
            <div className="li-card">
                <div className="li-card-title">
                    <ChevronRight size={17} color="#003a9b" />
                    How to find your LinkedIn profile URL
                </div>
                <div className="li-steps">
                    {STEPS.map((s, i) => (
                        <div key={i} className="li-step">
                            <div className="li-step-num">{i + 1}</div>
                            <div>
                                <div className="li-step-title">{s.title}</div>
                                <div className="li-step-sub">{s.sub}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="li-divider" />

                <a
                    href="https://www.linkedin.com/in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="li-btn outline"
                    style={{ textDecoration: "none" }}
                >
                    <ExternalLink size={15} /> Open LinkedIn
                </a>
            </div>

            {/* How it works with the extension */}
            <div className="li-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", border: "none" }}>
                <div className="li-card-title" style={{ color: "#fff" }}>
                    <Bot size={17} color="#60a5fa" />
                    How it works with Auto-Apply
                </div>
                <p className="li-card-sub" style={{ color: "#94a3b8" }}>
                    Once connected, the TalentFlow extension uses your LinkedIn profile URL in two ways:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                        { icon: "①", text: "When applying on LinkedIn — the extension verifies your identity and proceeds with Easy Apply on your behalf." },
                        { icon: "②", text: "On external company forms — your LinkedIn URL is auto-filled into \"LinkedIn Profile\" fields automatically." },
                        { icon: "③", text: "On resume — your profile URL is included in exported resumes for recruiters to find you quickly." },
                    ].map((item, i) => (
                        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                            <span style={{ fontSize: 18, color: "#60a5fa", flexShrink: 0 }}>{item.icon}</span>
                            <span style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>{item.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
