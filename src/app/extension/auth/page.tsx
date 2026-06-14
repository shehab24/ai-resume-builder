"use client";

import { useAuth, SignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2, Zap } from "lucide-react";

export default function ExtensionAuthPage() {
    const { isSignedIn, isLoaded } = useAuth();
    const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [authData, setAuthData] = useState<any>(null);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;
        if (status !== "idle") return;

        setStatus("generating");

        fetch("/api/extension/token")
            .then((res) => res.json())
            .then((data) => {
                if (data.error) throw new Error(data.error);

                // Send token back to the extension via postMessage
                // The background.js service worker listens for this
                window.postMessage(
                    {
                        type: "TALENTFLOW_AUTH",
                        token: data.token,
                        userId: data.userId,
                        name: data.name,
                        email: data.email,
                        photoUrl: data.photoUrl,
                        expiresAt: data.expiresAt,
                    },
                    "*"
                );

                // Also try chrome.runtime if available (for extensions using scripting)
                try {
                    // @ts-expect-error – chrome is injected by the extension
                    if (typeof chrome !== "undefined" && chrome.runtime) {
                        // @ts-expect-error
                        chrome.runtime.sendMessage({ type: "TALENTFLOW_AUTH", ...data });
                    }
                } catch { /* not in extension context */ }

                setAuthData(data);
                setStatus("done");

                // Auto-close the tab after 3 seconds
                setTimeout(() => window.close(), 3000);
            })
            .catch((err) => {
                setErrorMsg(err.message ?? "Something went wrong");
                setStatus("error");
            });
    }, [isSignedIn, isLoaded, status]);

    if (!isLoaded) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "#003a9b" }} />
                    <p style={styles.subtitle}>Loading…</p>
                </div>
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <div style={styles.container}>
                <style>{`
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                `}</style>
                <div style={{ ...styles.card, maxWidth: 480, gap: 20, animation: "fadeUp 0.4s ease" }}>
                    {/* Logo */}
                    <div style={styles.logo}>
                        <Zap size={22} color="#fff" />
                    </div>
                    <h1 style={styles.title}>Connect TalentFlow Extension</h1>
                    <p style={styles.subtitle}>Sign in to your TalentFlow account to activate the Auto-Applier</p>
                    <div style={{ width: "100%" }}>
                        <SignIn
                            routing="hash"
                            afterSignInUrl="/extension/auth"
                            appearance={{
                                elements: {
                                    rootBox: { width: "100%" },
                                    card: { boxShadow: "none", border: "1px solid #e2e8f0", borderRadius: 16 }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (status === "generating" || status === "idle") {
        return (
            <div style={styles.container}>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                <div style={styles.card}>
                    <div style={styles.logo}><Zap size={22} color="#fff" /></div>
                    <h1 style={styles.title}>Connecting Extension…</h1>
                    <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "#003a9b", margin: "8px 0" }} />
                    <p style={styles.subtitle}>Generating a secure token for your extension</p>
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={{ ...styles.logo, background: "#ef4444" }}><Zap size={22} color="#fff" /></div>
                    <h1 style={{ ...styles.title, color: "#dc2626" }}>Connection Failed</h1>
                    <p style={{ ...styles.subtitle, color: "#ef4444" }}>{errorMsg}</p>
                    <button
                        onClick={() => setStatus("idle")}
                        style={{ marginTop: 8, padding: "10px 24px", background: "#003a9b", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // status === "done"
    return (
        <div style={styles.container}>
            {authData && (
                <div
                    id="tf-auth-data"
                    style={{ display: "none" }}
                    data-token={authData.token}
                    data-userid={authData.userId}
                    data-name={authData.name}
                    data-email={authData.email}
                    data-photo={authData.photoUrl}
                    data-expires={authData.expiresAt}
                />
            )}
            <style>{`
                @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
            <div style={{ ...styles.card, animation: "fadeUp 0.4s ease" }}>
                <div style={{ animation: "popIn 0.5s ease forwards" }}>
                    <CheckCircle size={56} color="#22c55e" strokeWidth={1.5} />
                </div>
                <h1 style={{ ...styles.title, color: "#15803d" }}>Extension Connected! 🎉</h1>
                <p style={styles.subtitle}>
                    TalentFlow Auto-Applier is now linked to your account.<br />
                    This tab will close automatically…
                </p>
                <div style={{
                    marginTop: 12, padding: "12px 20px", background: "#f0fdf4",
                    border: "1.5px solid #86efac", borderRadius: 12, fontSize: 13, color: "#166534"
                }}>
                    ✓ Your resume and profile are ready to auto-fill job applications
                </div>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #eff6ff 100%)",
        fontFamily: "'Inter', sans-serif",
        padding: "20px"
    },
    card: {
        background: "#fff",
        borderRadius: 20,
        padding: "40px 32px",
        maxWidth: 440,
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        textAlign: "center"
    },
    logo: {
        width: 52,
        height: 52,
        borderRadius: 14,
        background: "linear-gradient(135deg, #003a9b, #0055e9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
        boxShadow: "0 8px 20px rgba(0,58,155,0.3)"
    },
    title: {
        fontSize: 22,
        fontWeight: 700,
        color: "#1e293b",
        margin: 0,
        letterSpacing: "-0.3px"
    },
    subtitle: {
        fontSize: 14,
        color: "#64748b",
        margin: 0,
        lineHeight: 1.6
    }
};
