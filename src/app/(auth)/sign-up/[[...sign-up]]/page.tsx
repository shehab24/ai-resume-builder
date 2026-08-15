import { SignUp } from "@clerk/nextjs";
import { Briefcase, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

html, body { margin: 0; padding: 0; height: 100%; }
*, *::before, *::after { box-sizing: border-box; }

.auth-root {
    width: 100vw;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    display: flex;
}

/* ── Left branding panel ── */
.auth-left {
    width: 42%;
    min-height: 100vh;
    background: linear-gradient(145deg, #001f6b 0%, #003a9b 55%, #0055e0 100%);
    padding: 48px 52px;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
}
.auth-left::before {
    content: '';
    position: absolute; bottom: -120px; right: -120px;
    width: 380px; height: 380px; border-radius: 50%;
    background: rgba(255,255,255,0.04);
}
.auth-left::after {
    content: '';
    position: absolute; top: -80px; left: -80px;
    width: 260px; height: 260px; border-radius: 50%;
    background: rgba(255,255,255,0.03);
}
@media (max-width: 860px) { .auth-left { display: none; } }

.auth-brand {
    display: flex; align-items: center; gap: 11px; margin-bottom: 64px; z-index: 1;
    text-decoration: none;
}
.auth-brand:hover { opacity: 0.85; }
.auth-brand-icon {
    width: 42px; height: 42px; background: rgba(255,255,255,0.15);
    border-radius: 11px; display: flex; align-items: center; justify-content: center;
}
.auth-brand-name { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }
.auth-brand-name span { color: #7eb8ff; }

.auth-headline {
    font-size: 36px; font-weight: 800; color: #fff;
    line-height: 1.15; letter-spacing: -0.8px; margin-bottom: 16px; z-index: 1;
}
.auth-headline span { color: #7eb8ff; }
.auth-sub {
    font-size: 15px; color: rgba(255,255,255,0.65);
    line-height: 1.7; margin-bottom: 52px; z-index: 1;
}

.auth-features { display: flex; flex-direction: column; gap: 16px; z-index: 1; }
.auth-feature { display: flex; align-items: center; gap: 13px; }
.auth-feature-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.auth-feature-text { font-size: 14px; color: rgba(255,255,255,0.85); font-weight: 500; }

.auth-footer {
    margin-top: auto; padding-top: 32px;
    border-top: 1px solid rgba(255,255,255,0.12);
    font-size: 12px; color: rgba(255,255,255,0.4); z-index: 1;
}

/* ── Right panel ── */
.auth-right {
    flex: 1;
    min-height: 100vh;
    background: #f4f6fb;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    overflow-y: auto;
}

/* Clerk widget centering overrides */
.auth-right .cl-rootBox {
    width: auto !important;
    max-width: 480px;
    margin: 0 auto;
}
.auth-right .cl-card {
    box-shadow: 0 4px 24px rgba(0,0,0,0.08) !important;
    border-radius: 18px !important;
    border: none !important;
}
`;

const features = [
    "Free AI resume builder included",
    "Match with top employers instantly",
    "ATS-optimised resume formatting",
    "Automated job applications (Pro)",
];

export default function SignUpPage() {
    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <div className="auth-root">

                {/* Left panel */}
                <div className="auth-left">
                    <Link href="/" className="auth-brand">
                        <div className="auth-brand-icon">
                            <Briefcase size={22} color="#fff" />
                        </div>
                        <div className="auth-brand-name">Talent<span>Flow</span></div>
                    </Link>

                    <h1 className="auth-headline">
                        Launch your career<br />with <span>TalentFlow</span>
                    </h1>
                    <p className="auth-sub">
                        Join thousands of professionals and companies using TalentFlow to find the perfect match — faster and smarter.
                    </p>

                    <div className="auth-features">
                        {features.map((f) => (
                            <div className="auth-feature" key={f}>
                                <div className="auth-feature-icon">
                                    <CheckCircle2 size={16} color="#7eb8ff" />
                                </div>
                                <span className="auth-feature-text">{f}</span>
                            </div>
                        ))}
                    </div>

                    <div className="auth-footer">© 2025 TalentFlow · All rights reserved</div>
                </div>

                {/* Right panel — Clerk sign-up widget */}
                <div className="auth-right">
                    <SignUp signInUrl="/sign-in" />
                </div>

            </div>
        </>
    );
}
