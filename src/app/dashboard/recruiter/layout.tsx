"use client";

import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Briefcase,
    Users,
    PlusCircle,
    Video,
    BarChart2,
    Home,
    Settings,
    HelpCircle,
    ArrowLeftRight,
    ChevronDown,
    LogOut,
    Crown,
    User,
    AlertTriangle,
    Compass,
    Bug,
    RefreshCw,
} from "lucide-react";
import { Notifications } from "@/components/Notifications";
import { useEffect, useState, useRef } from "react";
import UserPing from "@/components/user-ping";

/* ─── Styles ─── */
const sidebarStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .rl-sidebar {
        width: 260px;
        height: 100vh;
        position: sticky;
        top: 0;
        background: #fff;
        display: flex;
        flex-direction: column;
        box-shadow: 0 0 20px rgba(0,0,0,0.05);
        border-right: 1px solid rgba(0,0,0,0.06);
        z-index: 10;
        transition: width 200ms ease;
        font-family: 'Inter', sans-serif;
        overflow: hidden;
    }
    .rl-sidebar.collapsed {
        width: 80px;
    }
    .rl-create-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 11px 16px;
        background: #003a9b;
        color: #fff;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        transition: background 150ms;
        white-space: nowrap;
        overflow: hidden;
        font-family: 'Inter', sans-serif;
    }
    .rl-create-btn:hover { background: #002d7a; }
    .rl-sidebar.collapsed .rl-create-btn {
        width: 48px;
        height: 48px;
        padding: 0;
        border-radius: 14px;
        margin: 0 auto;
    }
    .rl-section-label {
        font-size: 10px;
        font-weight: 700;
        color: #94a3b8;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 18px 10px 6px;
        font-family: 'Inter', sans-serif;
    }
    .rl-sidebar.collapsed .rl-section-label {
        display: none;
    }
    .rl-nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 13px 14px;
        border-radius: 10px;
        color: #64748b;
        font-size: 14px;
        font-weight: 500;
        text-decoration: none;
        transition: background 120ms, color 120ms;
        margin-bottom: 6px;
        white-space: nowrap;
        overflow: hidden;
        font-family: 'Inter', sans-serif;
    }
    .rl-nav-item:hover { background: #f1f5f9; color: #1e293b; }
    .rl-nav-item.active {
        background: #eef2ff;
        color: #003a9b;
        font-weight: 600;
    }
    .rl-nav-item svg { flex-shrink: 0; }
    .rl-sidebar.collapsed .rl-nav-item {
        justify-content: center;
        padding: 12px 0;
        width: 48px;
        margin: 0 auto 4px;
    }
    .rl-sidebar.collapsed .rl-nav-item span { display: none; }
    .rl-section-divider {
        height: 1px;
        background: #f1f5f9;
        margin: 8px 12px;
    }
    .rl-sidebar.collapsed .rl-section-divider {
        margin: 6px auto;
        width: 40px;
    }
    .rl-bottom-section {
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        border-top: 1px solid rgba(0,0,0,0.06);
    }
    .rl-sidebar.collapsed .rl-bottom-section {
        padding: 12px 0;
        align-items: center;
    }
    .rl-help-btn {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 10px;
        color: #64748b;
        font-size: 14px;
        font-weight: 500;
        text-decoration: none;
        transition: background 120ms;
        font-family: 'Inter', sans-serif;
    }
    .rl-help-btn:hover { background: #f1f5f9; color: #1e293b; }
    .rl-sidebar.collapsed .rl-help-btn {
        justify-content: center;
        width: 48px;
        padding: 12px 0;
    }
    .rl-sidebar.collapsed .rl-help-btn span { display: none; }
    .rl-collapse-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        color: #64748b;
        font-size: 14px;
        font-weight: 500;
        background: none;
        border: none;
        cursor: pointer;
        transition: background 120ms;
        width: 100%;
        font-family: 'Inter', sans-serif;
    }
    .rl-collapse-btn:hover { background: #f1f5f9; }
    .rl-sidebar.collapsed .rl-collapse-btn {
        width: 48px;
        height: 48px;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        margin: 0 auto;
        padding: 0;
        justify-content: center;
    }
    .rl-sidebar.collapsed .rl-collapse-btn span { display: none; }
    /* ── Container ── */
    .rl-container {
        max-width: 1240px;
        width: 100%;
        margin: 0 auto;
    }
    /* ── Header ── */
    .rl-header {
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 25px;
        position: relative;
        font-family: 'Inter', sans-serif;
    }
    .rl-header .rl-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        position: relative;
    }
    .rl-logo {
        font-size: 22px;
        font-weight: 700;
        color: #1e293b;
        letter-spacing: -0.3px;
        font-family: 'Inter', sans-serif;
    }
    .rl-logo span { color: #003a9b; }
    .rl-upgrade-btn {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 9px 18px;
        background: #f59e0b;
        color: #fff;
        border: none;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background 150ms;
        font-family: 'Inter', sans-serif;
    }
    .rl-upgrade-btn:hover { background: #d97706; }
    /* ── Profile Dropdown ── */
    .rl-profile-trigger {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px;
        border: none;
        background: transparent;
        transition: opacity 150ms;
        position: relative;
        cursor: pointer;
    }
    .rl-profile-trigger:hover { opacity: 0.85; }
    .rl-profile-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #e2e8f0;
    }
    .rl-profile-chevron {
        color: #64748b;
        transition: transform 200ms;
    }
    .rl-profile-trigger.open .rl-profile-chevron {
        transform: rotate(180deg);
    }
    .rl-profile-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 220px;
        background: #fff;
        border-radius: 14px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.08);
        padding: 8px 0;
        z-index: 100;
        font-family: 'Inter', sans-serif;
        animation: rl-dropdown-in 150ms ease;
    }
    @keyframes rl-dropdown-in {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    .rl-dropdown-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 18px;
        font-size: 14px;
        font-weight: 500;
        color: #1e293b;
        cursor: pointer;
        transition: background 100ms;
        border: none;
        background: none;
        width: 100%;
        text-decoration: none;
        font-family: 'Inter', sans-serif;
    }
    .rl-dropdown-item:hover { background: #f8fafc; }
    .rl-dropdown-item svg { color: #64748b; }
    .rl-dropdown-divider {
        height: 1px;
        background: #f1f5f9;
        margin: 6px 0;
    }
    .rl-dropdown-version {
        padding: 6px 18px;
        font-size: 11px;
        color: #94a3b8;
        font-family: 'Inter', sans-serif;
    }
    .rl-dropdown-logout {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 18px;
        font-size: 14px;
        font-weight: 500;
        color: #dc2626;
        cursor: pointer;
        transition: background 100ms;
        border: none;
        background: none;
        width: 100%;
        font-family: 'Inter', sans-serif;
    }
    .rl-dropdown-logout:hover { background: #fef2f2; }
    .rl-dropdown-logout svg { color: #dc2626; }
    .rl-dropdown-switch {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 18px;
        font-size: 14px;
        font-weight: 500;
        color: #003a9b;
        cursor: pointer;
        transition: background 100ms;
        border: none;
        background: none;
        width: 100%;
        font-family: 'Inter', sans-serif;
    }
    .rl-dropdown-switch:hover { background: #eff6ff; }
    .rl-dropdown-switch svg { color: #003a9b; }
    .rl-pro-badge {
        font-size: 9px;
        font-weight: 700;
        background: #fde68a;
        color: #92400e;
        padding: 2px 6px;
        border-radius: 999px;
        margin-left: auto;
    }
    @media (max-width: 767px) {
        .rl-sidebar { display: none !important; }
    }
`;

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { signOut } = useClerk();
    const { user } = useUser();
    const [collapsed, setCollapsed] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState<string>("");
    const [switching, setSwitching] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Check role & fetch profile photo
    useEffect(() => {
        const checkProfile = async () => {
            try {
                const res = await fetch("/api/user/profile");
                if (res.ok) {
                    const data = await res.json();

                    // Wrong role — redirect immediately
                    if (data.role && data.role !== "RECRUITER") {
                        if (data.role === "JOB_SEEKER") window.location.href = "/dashboard/job-seeker";
                        else if (data.role === "ADMIN") window.location.href = "/dashboard/admin";
                        return;
                    }

                    // ── BLOCKED: admin explicitly revoked recruiter access ──
                    if ((data.recruiterStatus as string) === "BLOCKED") {
                        window.location.href = "/dashboard/job-seeker?blocked=1";
                        return;
                    }

                    // ── NOT APPROVED: must complete /go through the application flow ──
                    // This catches NONE (directly assigned without approval) and PENDING
                    if (data.recruiterStatus !== "APPROVED") {
                        window.location.href = "/recruiter-onboarding";
                        return;
                    }

                    // Platform-level block (e.g. Terms violation)
                    if (data.isBlocked) {
                        if (!data.blockedUntil || new Date(data.blockedUntil) >= new Date()) {
                            window.location.href = "/blocked";
                        }
                    }
                    if (data.photoUrl) setProfilePhoto(data.photoUrl);
                }
            } catch (error) {
                console.error("Failed to check profile:", error);
            }
        };
        checkProfile();
    }, [pathname]);



    const isActive = (href: string, exact = false) =>
        exact ? pathname === href : pathname.startsWith(href);

    const navItems = {
        main: [
            { href: "/dashboard/recruiter", icon: <Home size={22} />, label: "Dashboard", exact: true },
            { href: "/dashboard/recruiter/jobs", icon: <Briefcase size={22} />, label: "My Jobs" },
            { href: "/dashboard/recruiter/jobs/create", icon: <PlusCircle size={22} />, label: "Post a Job" },
            { href: "/dashboard/recruiter/candidates", icon: <Users size={22} />, label: "Candidates" },
            { href: "/dashboard/recruiter/applications", icon: <BarChart2 size={22} />, label: "Applications" },
        ],
        tools: [
            { href: "/dashboard/recruiter/interviews", icon: <Video size={22} />, label: "Interviews", pro: true },
        ],
        settings: [
            { href: "/dashboard/recruiter/profile", icon: <Settings size={22} />, label: "Profile" },
        ],
    };

    return (
        <>
            <UserPing />
            <style dangerouslySetInnerHTML={{ __html: sidebarStyles }} />
            <div style={{ display: "flex", minHeight: "100vh", background: "#f6f7f9" }}>

                {/* ━━━━━━ SIDEBAR ━━━━━━ */}
                <aside className={`rl-sidebar ${collapsed ? "collapsed" : ""}`}>

                    {/* Post a Job Button */}
                    <div style={{ padding: collapsed ? "20px 16px 10px" : "24px 18px 8px" }}>
                        <Link href="/dashboard/recruiter/jobs/create" className="rl-create-btn">
                            <PlusCircle size={collapsed ? 22 : 18} strokeWidth={2.5} />
                            {!collapsed && "Post a Job"}
                        </Link>
                    </div>

                    {/* Nav */}
                    <nav style={{ flex: 1, overflowY: "auto", padding: collapsed ? "0 8px" : "0 14px" }}>

                        {/* MAIN */}
                        <div className="rl-section-label">Recruiter Hub</div>
                        {navItems.main.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`rl-nav-item ${isActive(item.href, item.exact) ? "active" : ""}`}
                                title={collapsed ? item.label : undefined}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        ))}

                        <div className="rl-section-divider" />

                        {/* TOOLS */}
                        <div className="rl-section-label">Tools</div>
                        {navItems.tools.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`rl-nav-item ${isActive(item.href) ? "active" : ""}`}
                                title={collapsed ? item.label : undefined}
                                style={{ justifyContent: collapsed ? "center" : "flex-start" }}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                                {!collapsed && item.pro && (
                                    <span className="rl-pro-badge">PRO</span>
                                )}
                            </Link>
                        ))}

                        <div className="rl-section-divider" />

                        {/* SETTINGS */}
                        <div className="rl-section-label">Settings</div>
                        {navItems.settings.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`rl-nav-item ${isActive(item.href) ? "active" : ""}`}
                                title={collapsed ? item.label : undefined}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Bottom Section */}
                    <div className="rl-bottom-section">
                        <button
                            className="rl-collapse-btn"
                            onClick={() => setCollapsed(!collapsed)}
                            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            <ArrowLeftRight size={18} />
                            <span>{collapsed ? "" : "Collapse"}</span>
                        </button>
                        <Link href="#" className="rl-help-btn">
                            <HelpCircle size={22} />
                            <span>Help Center</span>
                        </Link>
                    </div>
                </aside>

                {/* ━━━━━━ MAIN ━━━━━━ */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

                    {/* Header */}
                    <header className="rl-header" style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                        <div className="rl-container">
                            <div className="rl-logo">
                                Talent<span>Flow</span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginLeft: 8, letterSpacing: 0 }}>Recruiter</span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <button className="rl-upgrade-btn">
                                    <Crown size={14} />
                                    Upgrade Now
                                </button>
                                <Notifications />

                                {/* Profile Dropdown */}
                                <div ref={profileRef} style={{ position: "relative" }}>
                                    <button
                                        className={`rl-profile-trigger ${profileOpen ? "open" : ""}`}
                                        onClick={() => setProfileOpen(!profileOpen)}
                                    >
                                        <img
                                            src={profilePhoto || user?.imageUrl || "/default-avatar.png"}
                                            alt="Profile"
                                            className="rl-profile-avatar"
                                        />
                                        <ChevronDown size={16} className="rl-profile-chevron" />
                                    </button>

                                    {profileOpen && (
                                        <div className="rl-profile-dropdown">
                                            <Link href="/dashboard/recruiter/profile" className="rl-dropdown-item" onClick={() => setProfileOpen(false)}>
                                                <User size={16} />
                                                Profile
                                            </Link>
                                            <Link href="#" className="rl-dropdown-item" onClick={() => setProfileOpen(false)}>
                                                <HelpCircle size={16} />
                                                Help Center
                                            </Link>
                                            <button className="rl-dropdown-item" onClick={() => setProfileOpen(false)}>
                                                <Bug size={16} />
                                                Report a Bug
                                            </button>
                                            <div className="rl-dropdown-divider" />
                                            {/* Switch to Job Seeker */}
                                            <button
                                                className="rl-dropdown-switch"
                                                disabled={switching}
                                                onClick={async () => {
                                                    setSwitching(true);
                                                    try {
                                                        const switchRes = await fetch("/api/user/switch-role", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ newRole: "JOB_SEEKER" }),
                                                        });
                                                        const switchData = await switchRes.json();
                                                        if (switchRes.ok) {
                                                            window.location.href = switchData.redirectTo || "/dashboard/job-seeker";
                                                        } else {
                                                            alert(switchData.error || "Failed to switch role");
                                                            setSwitching(false);
                                                        }
                                                    } catch {
                                                        alert("Failed to switch role");
                                                        setSwitching(false);
                                                    }
                                                }}
                                            >
                                                <RefreshCw size={16} className={switching ? "animate-spin" : ""} />
                                                {switching ? "Switching..." : "Switch to Job Seeker"}
                                            </button>
                                            <div className="rl-dropdown-divider" />
                                            <div className="rl-dropdown-version">Version 1.0.0</div>
                                            <button
                                                className="rl-dropdown-logout"
                                                onClick={() => signOut({ redirectUrl: "/" })}
                                            >
                                                <LogOut size={16} />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Content */}
                    <main style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                        <div className="rl-container">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
