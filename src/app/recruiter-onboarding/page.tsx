"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Loader2, Building2, Globe, Users, Mail, CheckCircle2,
    ArrowLeft, Clock, XCircle, ShieldCheck, Send, KeyRound,
    ChevronRight, Sparkles, Briefcase,
} from "lucide-react";
import Link from "next/link";

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
*, *::before, *::after { box-sizing: border-box; }

.ro-root {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    font-family: 'Inter', sans-serif;
    display: flex;
}

/* ── Left panel ── */
.ro-left {
    width: 38%;
    min-width: 280px;
    max-width: 420px;
    height: 100vh;
    background: linear-gradient(145deg, #001f6b 0%, #003a9b 55%, #0055e0 100%);
    padding: 36px 40px;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}
@media (max-width: 860px) { .ro-left { display: none; } }

.ro-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 40px; }
.ro-brand-icon {
    width: 38px; height: 38px; background: rgba(255,255,255,0.15);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
}
.ro-brand-name { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }
.ro-brand-name span { color: #7eb8ff; }

.ro-left-headline {
    font-size: 28px; font-weight: 800; color: #fff;
    line-height: 1.2; letter-spacing: -0.5px; margin-bottom: 13px;
}
.ro-left-headline span { color: #7eb8ff; }
.ro-left-sub { font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.65; margin-bottom: 40px; }

.ro-steps { display: flex; flex-direction: column; gap: 20px; }
.ro-step { display: flex; align-items: flex-start; gap: 14px; }
.ro-step-num {
    width: 28px; height: 28px; border-radius: 50%;
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25);
    color: #fff; font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.ro-step-num.active { background: rgba(255,255,255,0.95); color: #003a9b; }
.ro-step-title { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 2px; }
.ro-step-desc { font-size: 11px; color: rgba(255,255,255,0.5); }

.ro-left-footer {
    margin-top: auto;
    padding-top: 22px;
    border-top: 1px solid rgba(255,255,255,0.12);
    font-size: 11px; color: rgba(255,255,255,0.4);
}

/* ── Right panel — scrollable, card centered ── */
.ro-right {
    flex: 1;
    height: 100vh;
    overflow-y: auto;
    padding: 28px 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f4f6fb;
}

/* Card is content-height, max-width controlled — no stretching */
.ro-card {
    width: 100%;
    max-width: 680px;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.09);
    overflow: hidden;
}

.ro-card-top {
    background: linear-gradient(135deg, #001f6b, #003a9b);
    padding: 20px 28px; position: relative; overflow: hidden;
}
.ro-card-top::before {
    content: ''; position: absolute; top: -40px; right: -40px;
    width: 150px; height: 150px; border-radius: 50%;
    background: rgba(255,255,255,0.06);
}
.ro-card-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2);
    color: #fff; font-size: 11px; font-weight: 600;
    padding: 4px 10px; border-radius: 999px; margin-bottom: 8px;
}
.ro-card-title { font-size: 18px; font-weight: 800; color: #fff; margin: 0 0 3px; }
.ro-card-subtitle { font-size: 12px; color: rgba(255,255,255,0.65); margin: 0; }

/* Form — normal stacked layout, no flex fill */
.ro-form {
    padding: 20px 28px 24px;
}

.ro-fields { display: flex; flex-direction: column; gap: 13px; margin-bottom: 16px; }

/* Responsive */
@media (max-width: 1100px) { .ro-right { padding: 24px 32px; } }
@media (max-width: 860px)  { .ro-right { padding: 20px 24px; } }
@media (max-width: 600px)  { .ro-right { padding: 16px; align-items: flex-start; } .ro-card { border-radius: 14px; } }

.ro-label {
    display: block; font-size: 12px; font-weight: 600; color: #374151;
    margin-bottom: 5px;
}
.ro-label .ro-req { color: #ef4444; margin-left: 2px; }
.ro-input-wrap { position: relative; }
.ro-input-icon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    color: #9ca3af; pointer-events: none;
}
.ro-input {
    width: 100%; padding: 9px 12px 9px 38px;
    border: 1.5px solid #e5e7eb; border-radius: 10px;
    font-size: 13px; color: #1f2937; font-family: 'Inter', sans-serif;
    outline: none; transition: border-color 150ms, box-shadow 150ms;
    background: #fafafa;
}
.ro-input:focus { border-color: #003a9b; box-shadow: 0 0 0 3px rgba(0,58,155,0.08); background: #fff; }
.ro-input:disabled { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; }
.ro-input.verified { border-color: #22c55e; padding-right: 38px; }
.ro-input-check {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    color: #22c55e;
}
.ro-textarea {
    width: 100%; padding: 9px 12px;
    border: 1.5px solid #e5e7eb; border-radius: 10px;
    font-size: 13px; color: #1f2937; font-family: 'Inter', sans-serif;
    outline: none; transition: border-color 150ms, box-shadow 150ms;
    background: #fafafa; resize: none; height: 196px;
}
.ro-textarea:focus { border-color: #003a9b; box-shadow: 0 0 0 3px rgba(0,58,155,0.08); background: #fff; }

.ro-email-row { display: flex; gap: 8px; }
.ro-email-row .ro-input-wrap { flex: 1; }
.ro-verify-btn {
    padding: 9px 14px; border-radius: 10px; font-size: 12px; font-weight: 600;
    border: 1.5px solid #e5e7eb; background: #fff; color: #374151;
    cursor: pointer; white-space: nowrap; font-family: 'Inter', sans-serif;
    transition: border-color 150ms, background 150ms;
    display: flex; align-items: center; gap: 6px;
}
.ro-verify-btn:hover:not(:disabled) { border-color: #003a9b; color: #003a9b; background: #eff6ff; }
.ro-verify-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.ro-otp-row { display: flex; gap: 8px; margin-top: 6px; }
.ro-otp-input {
    flex: 1; padding: 9px 12px; border: 1.5px solid #fbbf24;
    border-radius: 10px; font-size: 15px; font-weight: 600; letter-spacing: 6px;
    color: #1f2937; font-family: 'Inter', sans-serif; outline: none;
    background: #fffbeb; text-align: center;
}
.ro-otp-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(251,191,36,0.15); }
.ro-confirm-btn {
    padding: 9px 15px; border-radius: 10px; font-size: 12px; font-weight: 600;
    border: none; background: #f59e0b; color: #fff;
    cursor: pointer; font-family: 'Inter', sans-serif;
    display: flex; align-items: center; gap: 6px; transition: background 150ms;
}
.ro-confirm-btn:hover:not(:disabled) { background: #d97706; }
.ro-confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.ro-hint { font-size: 11px; color: #6b7280; margin-top: 4px; }
.ro-hint.success { color: #16a34a; }
.ro-otp-banner {
    display: flex; align-items: center; gap: 8px;
    background: #fffbeb; border: 1px solid #fde68a;
    border-radius: 8px; padding: 8px 12px;
    font-size: 12px; color: #92400e; margin-top: 5px;
}

/* Size chips — single row of 6 */
.ro-size-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
.ro-size-chip {
    padding: 8px 4px; border-radius: 9px; font-size: 12px; font-weight: 500;
    border: 1.5px solid #e5e7eb; background: #fafafa; color: #6b7280;
    cursor: pointer; text-align: center; transition: all 150ms;
    font-family: 'Inter', sans-serif;
}
.ro-size-chip:hover { border-color: #003a9b; color: #003a9b; background: #eff6ff; }
.ro-size-chip.selected { border-color: #003a9b; background: #003a9b; color: #fff; }

/* Bottom section */
.ro-bottom { display: flex; flex-direction: column; gap: 12px; }

.ro-info-box {
    background: #f0f7ff; border: 1px solid #bfdbfe;
    border-radius: 10px; padding: 11px 14px;
    display: flex; gap: 10px; align-items: flex-start;
}
.ro-info-icon { color: #3b82f6; flex-shrink: 0; margin-top: 1px; }
.ro-info-text { font-size: 12px; color: #1e40af; line-height: 1.5; }
.ro-info-text strong { font-weight: 600; color: #1e3a8a; }

.ro-actions { display: flex; justify-content: space-between; align-items: center; }
.ro-cancel-btn {
    padding: 10px 22px; border-radius: 10px; font-size: 13px; font-weight: 600;
    border: 1.5px solid #e5e7eb; background: #fff; color: #6b7280;
    cursor: pointer; font-family: 'Inter', sans-serif; transition: all 150ms;
}
.ro-cancel-btn:hover { border-color: #d1d5db; background: #f9fafb; }
.ro-submit-btn {
    padding: 11px 26px; border-radius: 10px; font-size: 13px; font-weight: 700;
    border: none; background: linear-gradient(135deg, #001f6b, #003a9b);
    color: #fff; cursor: pointer; font-family: 'Inter', sans-serif;
    display: flex; align-items: center; gap: 7px;
    transition: opacity 150ms, transform 150ms;
    box-shadow: 0 4px 14px rgba(0,58,155,0.3);
}
.ro-submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.ro-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

/* ── Status screens ── */
.ro-status-root {
    min-height: 100vh; background: #f4f6fb;
    font-family: 'Inter', sans-serif;
    display: flex; align-items: center; justify-content: center; padding: 24px;
}
.ro-status-card {
    background: #fff; border-radius: 24px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.07);
    padding: 48px 40px; max-width: 460px; width: 100%; text-align: center;
}
.ro-status-icon {
    width: 72px; height: 72px; border-radius: 20px;
    display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;
}
.ro-status-icon.pending  { background: #eff6ff; }
.ro-status-icon.rejected { background: #fef2f2; }
.ro-status-title { font-size: 22px; font-weight: 800; color: #111827; margin: 0 0 10px; }
.ro-status-desc  { font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0 0 28px; }
.ro-back-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px; border-radius: 12px;
    border: 1.5px solid #e5e7eb; background: #fff; color: #374151;
    font-size: 14px; font-weight: 600; cursor: pointer;
    font-family: 'Inter', sans-serif; text-decoration: none; transition: all 150ms;
}
.ro-back-btn:hover { border-color: #003a9b; color: #003a9b; background: #eff6ff; }
.ro-pending-steps {
    display: flex; flex-direction: column; gap: 12px;
    background: #f8fafc; border-radius: 14px; padding: 20px; margin-bottom: 28px; text-align: left;
}
.ro-ps-row { display: flex; align-items: center; gap: 12px; font-size: 13px; color: #374151; }
.ro-ps-dot { width: 8px; height: 8px; border-radius: 50%; background: #003a9b; flex-shrink: 0; }
`;

const SIZE_OPTIONS = ["1–10", "11–50", "51–200", "201–500", "500–1K", "1K+"];

export default function RecruiterOnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState("NONE");
    const [sendingOTP, setSendingOTP] = useState(false);
    const [verifyingOTP, setVerifyingOTP] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [showOTPInput, setShowOTPInput] = useState(false);
    const [formData, setFormData] = useState({
        companyName: "", companyEmail: "", website: "", size: "", description: "",
    });
    const [otp, setOtp] = useState("");

    useEffect(() => { checkStatus(); }, []);

    const checkStatus = async () => {
        try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
                const data = await res.json();
                setStatus(data.recruiterStatus || "NONE");
            }
        } catch { /* silent */ } finally { setLoading(false); }
    };

    const handleSendOTP = async () => {
        if (!formData.companyEmail) { toast.error("Please enter company email"); return; }
        setSendingOTP(true);
        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.companyEmail }),
            });
            if (res.ok) { setShowOTPInput(true); toast.success("Verification code sent!"); }
            else { const d = await res.json(); toast.error(d.error || "Failed to send code"); }
        } catch { toast.error("Something went wrong"); } finally { setSendingOTP(false); }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) { toast.error("Please enter the 6-digit code"); return; }
        setVerifyingOTP(true);
        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.companyEmail, token: otp }),
            });
            if (res.ok) { setEmailVerified(true); setShowOTPInput(false); toast.success("Email verified! ✓"); }
            else { const d = await res.json(); toast.error(d.error || "Invalid code"); }
        } catch { toast.error("Something went wrong"); } finally { setVerifyingOTP(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/recruiter/onboarding", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, emailVerified }),
            });
            if (res.ok) {
                toast.success("Application submitted! We'll review it shortly.");
                setTimeout(() => router.push("/dashboard/job-seeker"), 1500);
            } else {
                const d = await res.json(); toast.error(d.error || "Failed to submit");
            }
        } catch { toast.error("Something went wrong"); } finally { setSubmitting(false); }
    };

    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6fb", fontFamily: "Inter, sans-serif" }}>
            <Loader2 style={{ width: 28, height: 28, color: "#003a9b" }} className="animate-spin" />
        </div>
    );

    if (status === "APPROVED") { router.push("/dashboard/recruiter"); return null; }

    if (status === "PENDING") return (
        <>
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <div className="ro-status-root">
                <div className="ro-status-card">
                    <div className="ro-status-icon pending"><Clock size={32} color="#003a9b" /></div>
                    <h1 className="ro-status-title">Application Under Review</h1>
                    <p className="ro-status-desc">Your recruiter application is being reviewed. This usually takes 1–2 business days.</p>
                    <div className="ro-pending-steps">
                        <div className="ro-ps-row"><div className="ro-ps-dot" style={{ background: "#22c55e" }} /><span>Application received ✓</span></div>
                        <div className="ro-ps-row"><div className="ro-ps-dot" style={{ background: "#f59e0b" }} /><span>Team review in progress…</span></div>
                        <div className="ro-ps-row"><div className="ro-ps-dot" style={{ background: "#e5e7eb" }} /><span>You'll get an email once approved</span></div>
                    </div>
                    <a href="/dashboard/job-seeker" className="ro-back-btn"><ArrowLeft size={16} /> Back to Dashboard</a>
                </div>
            </div>
        </>
    );

    if (status === "REJECTED") return (
        <>
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <div className="ro-status-root">
                <div className="ro-status-card">
                    <div className="ro-status-icon rejected"><XCircle size={32} color="#dc2626" /></div>
                    <h1 className="ro-status-title">Application Not Approved</h1>
                    <p className="ro-status-desc">Your application wasn't approved. Contact support for more information or re-apply with updated details.</p>
                    <a href="/dashboard/job-seeker" className="ro-back-btn"><ArrowLeft size={16} /> Back to Dashboard</a>
                </div>
            </div>
        </>
    );

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <div className="ro-root">

                {/* ── Left Panel ── */}
                <div className="ro-left">
                    <div className="ro-brand">
                        <div className="ro-brand-icon"><Briefcase size={20} color="#fff" /></div>
                        <div className="ro-brand-name">Talent<span>Flow</span></div>
                    </div>
                    <h1 className="ro-left-headline">Start hiring <span>top talent</span> today</h1>
                    <p className="ro-left-sub">
                        Join thousands of companies using TalentFlow to find and hire the best candidates faster and smarter.
                    </p>
                    <div className="ro-steps">
                        {[
                            { n: "1", title: "Company Details", desc: "Tell us about your organization", active: true },
                            { n: "2", title: "Admin Review", desc: "Our team verifies your application", active: false },
                            { n: "3", title: "Access Granted", desc: "Start posting jobs and hiring", active: false },
                        ].map(s => (
                            <div className="ro-step" key={s.n}>
                                <div className={`ro-step-num ${s.active ? "active" : ""}`}>{s.n}</div>
                                <div>
                                    <div className="ro-step-title">{s.title}</div>
                                    <div className="ro-step-desc">{s.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="ro-left-footer">© 2025 TalentFlow · All rights reserved</div>
                </div>

                {/* ── Right Panel ── */}
                <div className="ro-right">
                    <div className="ro-card">

                        {/* Card header */}
                        <div className="ro-card-top">
                            <div className="ro-card-badge"><Sparkles size={11} /> Recruiter Application</div>
                            <h2 className="ro-card-title">Tell us about your company</h2>
                            <p className="ro-card-subtitle">Complete the form below to apply for recruiter access</p>
                        </div>

                        {/* Form */}
                        <form className="ro-form" onSubmit={handleSubmit}>

                            {/* Fields group */}
                            <div className="ro-fields">

                                {/* Company Name */}
                                <div>
                                    <label className="ro-label">Company Name <span className="ro-req">*</span></label>
                                    <div className="ro-input-wrap">
                                        <Building2 size={16} className="ro-input-icon" />
                                        <input className="ro-input" placeholder="Acme Corporation"
                                            value={formData.companyName}
                                            onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                            required />
                                    </div>
                                </div>

                                {/* Company Email */}
                                <div>
                                    <label className="ro-label">Company Email <span className="ro-req">*</span></label>
                                    <div className="ro-email-row">
                                        <div className="ro-input-wrap">
                                            <Mail size={16} className="ro-input-icon" />
                                            <input
                                                className={`ro-input ${emailVerified ? "verified" : ""}`}
                                                type="email" placeholder="contact@company.com"
                                                value={formData.companyEmail}
                                                onChange={e => {
                                                    setFormData({ ...formData, companyEmail: e.target.value });
                                                    setEmailVerified(false); setShowOTPInput(false);
                                                }}
                                                required disabled={emailVerified} />
                                            {emailVerified && <CheckCircle2 size={16} className="ro-input-check" />}
                                        </div>
                                        {!emailVerified && (
                                            <button type="button" className="ro-verify-btn"
                                                onClick={handleSendOTP} disabled={sendingOTP || !formData.companyEmail}>
                                                {sendingOTP ? <Loader2 size={14} className="animate-spin" /> : <><Send size={13} /> Verify</>}
                                            </button>
                                        )}
                                    </div>
                                    {showOTPInput && !emailVerified && (
                                        <>
                                            <div className="ro-otp-banner">
                                                <KeyRound size={14} />
                                                Check your inbox — 6-digit code sent to <strong style={{ marginLeft: 4 }}>{formData.companyEmail}</strong>
                                            </div>
                                            <div className="ro-otp-row">
                                                <input className="ro-otp-input" placeholder="······"
                                                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} maxLength={6} />
                                                <button type="button" className="ro-confirm-btn"
                                                    onClick={handleVerifyOTP} disabled={verifyingOTP || otp.length !== 6}>
                                                    {verifyingOTP ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} /> Confirm</>}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                    <p className={`ro-hint ${emailVerified ? "success" : ""}`}>
                                        {emailVerified ? "✓ Email verified — your application will be prioritised" : "Optional: Verifying your email increases approval speed"}
                                    </p>
                                </div>

                                {/* Website */}
                                <div>
                                    <label className="ro-label">Company Website <span className="ro-req">*</span></label>
                                    <div className="ro-input-wrap">
                                        <Globe size={16} className="ro-input-icon" />
                                        <input className="ro-input" type="url" placeholder="https://company.com"
                                            value={formData.website}
                                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                                            required />
                                    </div>
                                </div>

                                {/* Company Size */}
                                <div>
                                    <label className="ro-label">
                                        <Users size={13} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                                        Company Size
                                    </label>
                                    <div className="ro-size-grid">
                                        {SIZE_OPTIONS.map(opt => (
                                            <button key={opt} type="button"
                                                className={`ro-size-chip ${formData.size === opt ? "selected" : ""}`}
                                                onClick={() => setFormData({ ...formData, size: opt })}>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* About */}
                                <div>
                                    <label className="ro-label">About Your Company</label>
                                    <textarea className="ro-textarea"
                                        placeholder="What does your company do? What kind of talent are you looking for?"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>

                            </div>{/* /ro-fields */}

                            {/* Bottom: info + actions */}
                            <div className="ro-bottom">
                                <div className="ro-info-box">
                                    <ShieldCheck size={17} className="ro-info-icon" />
                                    <p className="ro-info-text">
                                        <strong>What happens next?</strong><br />
                                        Our team reviews your application within <strong>1–2 business days</strong>. You can continue using TalentFlow as a job seeker in the meantime.
                                    </p>
                                </div>
                                <div className="ro-actions">
                                    <button type="button" className="ro-cancel-btn"
                                        onClick={() => router.push("/dashboard/job-seeker")}>Cancel</button>
                                    <button type="submit" className="ro-submit-btn" disabled={submitting}>
                                        {submitting
                                            ? <><Loader2 size={15} className="animate-spin" /> Submitting…</>
                                            : <>Submit Application <ChevronRight size={15} /></>}
                                    </button>
                                </div>
                            </div>

                        </form>
                    </div>
                </div>

            </div>
        </>
    );
}
