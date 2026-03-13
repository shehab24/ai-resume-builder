"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import UserPing from "@/components/user-ping";
import {
    LayoutDashboard, Users, Briefcase, List, Globe, Plus, FileText,
    ChevronDown, ChevronRight, ArrowLeftRight, HelpCircle, LogOut,
    Crown, Shield, Zap, Bug, RefreshCw,
} from "lucide-react";
import { Notifications } from "@/components/Notifications";

const adminStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .rl-sidebar {
        width: 260px; height: 100vh; position: sticky; top: 0;
        background: #fff; display: flex; flex-direction: column;
        box-shadow: 0 0 20px rgba(0,0,0,0.05);
        border-right: 1px solid rgba(0,0,0,0.06);
        z-index: 10; transition: width 200ms ease;
        font-family: 'Inter', sans-serif; overflow: hidden;
    }
    .rl-sidebar.collapsed { width: 80px; }
    .rl-create-btn {
        display: flex; align-items: center; justify-content: center;
        gap: 8px; width: 100%; padding: 11px 16px;
        background: #dc2626; color: #fff; border-radius: 12px;
        font-size: 14px; font-weight: 600; text-decoration: none;
        transition: background 150ms; white-space: nowrap;
        overflow: hidden; font-family: 'Inter', sans-serif;
    }
    .rl-create-btn:hover { background: #b91c1c; }
    .rl-sidebar.collapsed .rl-create-btn {
        width: 48px; height: 48px; padding: 0; border-radius: 14px; margin: 0 auto;
    }
    .rl-section-label {
        font-size: 10px; font-weight: 700; color: #94a3b8;
        letter-spacing: 0.08em; text-transform: uppercase;
        padding: 18px 10px 6px; font-family: 'Inter', sans-serif;
    }
    .rl-sidebar.collapsed .rl-section-label { display: none; }
    .rl-nav-item {
        display: flex; align-items: center; gap: 12px;
        padding: 13px 14px; border-radius: 10px; color: #64748b;
        font-size: 14px; font-weight: 500; text-decoration: none;
        transition: background 120ms, color 120ms; margin-bottom: 6px;
        white-space: nowrap; overflow: hidden;
        font-family: 'Inter', sans-serif; cursor: pointer;
        border: none; background: none; width: 100%;
    }
    .rl-nav-item:hover { background: #f1f5f9; color: #1e293b; }
    .rl-nav-item.active { background: #fef2f2; color: #dc2626; font-weight: 600; }
    .rl-nav-item svg { flex-shrink: 0; }
    .rl-sidebar.collapsed .rl-nav-item {
        justify-content: center; padding: 12px 0; width: 48px; margin: 0 auto 4px;
    }
    .rl-sidebar.collapsed .rl-nav-item span { display: none; }
    .rl-section-divider { height: 1px; background: #f1f5f9; margin: 8px 12px; }
    .rl-sidebar.collapsed .rl-section-divider { margin: 6px auto; width: 40px; }
    .rl-jobs-sub {
        margin-left: 26px; padding-left: 14px;
        border-left: 2px solid #f1f5f9; margin-bottom: 6px;
    }
    .rl-sidebar.collapsed .rl-jobs-sub { display: none; }
    .rl-jobs-sub .rl-nav-item {
        padding: 10px 12px; font-size: 13px; margin-bottom: 2px;
    }
    .rl-badge {
        margin-left: auto; background: #dc2626; color: #fff;
        font-size: 10px; font-weight: 700; border-radius: 999px;
        padding: 2px 7px; min-width: 20px; text-align: center;
        flex-shrink: 0;
    }
    .rl-bottom-section {
        padding: 12px 14px; display: flex; flex-direction: column;
        gap: 6px; border-top: 1px solid rgba(0,0,0,0.06);
    }
    .rl-sidebar.collapsed .rl-bottom-section { padding: 12px 0; align-items: center; }
    .rl-help-btn {
        display: flex; align-items: center; gap: 12px; padding: 10px 12px;
        border-radius: 10px; color: #64748b; font-size: 14px; font-weight: 500;
        text-decoration: none; transition: background 120ms;
        font-family: 'Inter', sans-serif;
    }
    .rl-help-btn:hover { background: #f1f5f9; color: #1e293b; }
    .rl-sidebar.collapsed .rl-help-btn { justify-content: center; width: 48px; padding: 12px 0; }
    .rl-sidebar.collapsed .rl-help-btn span { display: none; }
    .rl-collapse-btn {
        display: flex; align-items: center; gap: 10px; padding: 10px 12px;
        border-radius: 10px; color: #64748b; font-size: 14px; font-weight: 500;
        background: none; border: none; cursor: pointer; transition: background 120ms;
        width: 100%; font-family: 'Inter', sans-serif;
    }
    .rl-collapse-btn:hover { background: #f1f5f9; }
    .rl-sidebar.collapsed .rl-collapse-btn {
        width: 48px; height: 48px; border: 1.5px solid #e2e8f0;
        border-radius: 12px; margin: 0 auto; padding: 0; justify-content: center;
    }
    .rl-sidebar.collapsed .rl-collapse-btn span { display: none; }
    /* Container */
    .rl-container { max-width: 1240px; width: 100%; margin: 0 auto; }
    /* Header */
    .rl-header {
        height: 80px; display: flex; align-items: center;
        justify-content: center; padding: 0 25px;
        font-family: 'Inter', sans-serif;
    }
    .rl-header .rl-container {
        display: flex; align-items: center;
        justify-content: space-between; width: 100%;
    }
    .rl-logo { font-size: 22px; font-weight: 700; color: #1e293b; letter-spacing: -0.3px; font-family: 'Inter', sans-serif; }
    .rl-logo span { color: #003a9b; }
    .rl-admin-badge {
        font-size: 11px; font-weight: 700; color: #ffffff !important;
        background: #dc2626; padding: 3px 10px; border-radius: 999px;
        margin-left: 10px; letter-spacing: 0; vertical-align: middle;
        display: inline-block;
    }
    .rl-upgrade-btn {
        display: flex; align-items: center; gap: 7px; padding: 9px 18px;
        background: #dc2626; color: #fff; border: none; border-radius: 999px;
        font-size: 13px; font-weight: 600; cursor: pointer;
        transition: background 150ms; font-family: 'Inter', sans-serif;
    }
    .rl-upgrade-btn:hover { background: #b91c1c; }
    /* Profile Dropdown */
    .rl-profile-trigger {
        display: flex; align-items: center; gap: 6px; padding: 4px;
        border: none; background: transparent; transition: opacity 150ms;
        position: relative; cursor: pointer;
    }
    .rl-profile-trigger:hover { opacity: 0.85; }
    .rl-profile-avatar {
        width: 40px; height: 40px; border-radius: 50%;
        object-fit: cover; border: 2px solid #e2e8f0;
    }
    .rl-profile-chevron { color: #64748b; transition: transform 200ms; }
    .rl-profile-trigger.open .rl-profile-chevron { transform: rotate(180deg); }
    .rl-profile-dropdown {
        position: absolute; top: calc(100% + 8px); right: 0;
        width: 220px; background: #fff; border-radius: 14px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.08);
        padding: 8px 0; z-index: 100; font-family: 'Inter', sans-serif;
        animation: rl-dropdown-in 150ms ease;
    }
    @keyframes rl-dropdown-in {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    .rl-dropdown-item {
        display: flex; align-items: center; gap: 12px; padding: 10px 18px;
        font-size: 14px; font-weight: 500; color: #1e293b; cursor: pointer;
        transition: background 100ms; border: none; background: none;
        width: 100%; text-decoration: none; font-family: 'Inter', sans-serif;
    }
    .rl-dropdown-item:hover { background: #f8fafc; }
    .rl-dropdown-item svg { color: #64748b; }
    .rl-dropdown-divider { height: 1px; background: #f1f5f9; margin: 6px 0; }
    .rl-dropdown-version { padding: 6px 18px; font-size: 11px; color: #94a3b8; font-family: 'Inter', sans-serif; }
    .rl-dropdown-logout {
        display: flex; align-items: center; gap: 12px; padding: 10px 18px;
        font-size: 14px; font-weight: 500; color: #dc2626; cursor: pointer;
        transition: background 100ms; border: none; background: none;
        width: 100%; font-family: 'Inter', sans-serif;
    }
    .rl-dropdown-logout:hover { background: #fef2f2; }
    .rl-dropdown-logout svg { color: #dc2626; }
    @media (max-width: 767px) { .rl-sidebar { display: none !important; } }
`;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { signOut } = useClerk();
    const { user } = useUser();
    const [jobsOpen, setJobsOpen] = useState(true);
    const [collapsed, setCollapsed] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [profilePhoto, setProfilePhoto] = useState("");
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

    // Check role
    useEffect(() => {
        const checkRole = async () => {
            try {
                const res = await fetch("/api/user/profile");
                if (res.ok) {
                    const data = await res.json();
                    if (data.role && data.role !== "ADMIN") {
                        if (data.role === "JOB_SEEKER") window.location.href = "/dashboard/job-seeker";
                        else if (data.role === "RECRUITER") window.location.href = "/dashboard/recruiter";
                    }
                    if (data.photoUrl) setProfilePhoto(data.photoUrl);
                }
            } catch (error) {
                console.error("Failed to check role:", error);
            }
        };
        checkRole();
    }, []);

    // Fetch pending applications count
    useEffect(() => {
        const fetchPending = async () => {
            try {
                const res = await fetch("/api/admin/recruiter-applications");
                if (res.ok) {
                    const data = await res.json();
                    const pending = data.applications.filter((app: any) => app.recruiterStatus === "PENDING");
                    setPendingCount(pending.length);
                }
            } catch { /* silent */ }
        };
        fetchPending();
        const interval = setInterval(fetchPending, 30000);
        return () => clearInterval(interval);
    }, []);

    // Auto-expand jobs sub-menu on jobs-related pages
    useEffect(() => {
        if (pathname.startsWith("/dashboard/admin/jobs") ||
            pathname.startsWith("/dashboard/admin/job-sources") ||
            pathname.startsWith("/dashboard/admin/import-job")) {
            setJobsOpen(true);
        }
    }, [pathname]);

    const isActive = (href: string, exact = false) =>
        exact ? pathname === href : pathname.startsWith(href);

    const navItems = [
        { href: "/dashboard/admin", icon: <LayoutDashboard size={20} />, label: "Overview", exact: true },
        { href: "/dashboard/admin/users", icon: <Users size={20} />, label: "User Management" },
        { href: "/dashboard/admin/recruiter-applications", icon: <FileText size={20} />, label: "Recruiter Applications", badge: pendingCount },
    ];

    const jobsSubMenu = [
        { href: "/dashboard/admin/jobs", icon: <List size={18} />, label: "All Jobs" },
        { href: "/dashboard/admin/job-sources", icon: <Globe size={18} />, label: "Job Sources" },
        { href: "/dashboard/admin/import-job", icon: <Plus size={18} />, label: "Import Job" },
    ];

    return (
        <>
            <UserPing />
            <style dangerouslySetInnerHTML={{ __html: adminStyles }} />
            <div style={{ display: "flex", minHeight: "100vh", background: "#f6f7f9" }}>

                {/* ━━━━━━ SIDEBAR ━━━━━━ */}
                <aside className={`rl-sidebar ${collapsed ? "collapsed" : ""}`}>

                    {/* Top brand area */}
                    <div style={{ padding: collapsed ? "20px 16px 10px" : "24px 18px 12px" }}>
                        {collapsed ? (
                            <div style={{ width: 48, height: 48, background: "#dc2626", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                                <Shield size={22} color="#fff" />
                            </div>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 36, height: 36, background: "#dc2626", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Shield size={18} color="#fff" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", fontFamily: "Inter, sans-serif" }}>Admin Panel</div>
                                    <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "Inter, sans-serif" }}>TalentFlow</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Nav */}
                    <nav style={{ flex: 1, overflowY: "auto", padding: collapsed ? "0 8px" : "0 14px" }}>

                        {/* MANAGEMENT */}
                        <div className="rl-section-label">Management</div>

                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`rl-nav-item ${isActive(item.href, item.exact) ? "active" : ""}`}
                                title={collapsed ? item.label : undefined}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                                {!collapsed && item.badge && item.badge > 0 && (
                                    <span className="rl-badge">{item.badge}</span>
                                )}
                            </Link>
                        ))}

                        <div className="rl-section-divider" />

                        {/* JOBS */}
                        <div className="rl-section-label">Jobs</div>

                        {/* Manage Jobs expandable */}
                        <button
                            className={`rl-nav-item ${isActive("/dashboard/admin/jobs") || isActive("/dashboard/admin/job-sources") || isActive("/dashboard/admin/import-job") ? "active" : ""}`}
                            onClick={() => !collapsed && setJobsOpen(!jobsOpen)}
                            title={collapsed ? "Manage Jobs" : undefined}
                            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
                        >
                            <Briefcase size={20} />
                            <span style={{ flex: 1, textAlign: "left" }}>Manage Jobs</span>
                            {!collapsed && (
                                jobsOpen
                                    ? <ChevronDown size={16} style={{ color: "#94a3b8", flexShrink: 0 }} />
                                    : <ChevronRight size={16} style={{ color: "#94a3b8", flexShrink: 0 }} />
                            )}
                        </button>

                        {/* Sub-menu */}
                        {!collapsed && jobsOpen && (
                            <div className="rl-jobs-sub">
                                {jobsSubMenu.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`rl-nav-item ${isActive(item.href) ? "active" : ""}`}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </nav>

                    {/* Bottom */}
                    <div className="rl-bottom-section">
                        <button
                            className="rl-collapse-btn"
                            onClick={() => setCollapsed(!collapsed)}
                            title={collapsed ? "Expand" : "Collapse"}
                        >
                            <ArrowLeftRight size={18} />
                            <span>Collapse</span>
                        </button>
                        <Link href="#" className="rl-help-btn">
                            <HelpCircle size={20} />
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
                                <span className="rl-admin-badge">Admin</span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <button className="rl-upgrade-btn">
                                    <Shield size={14} />
                                    Admin Panel
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
                                            {/* Admin identity */}
                                            <div style={{ padding: "10px 18px 8px", borderBottom: "1px solid #f1f5f9", marginBottom: 4 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", display: "flex", alignItems: "center", gap: 6 }}>
                                                    <Shield size={13} />
                                                    Administrator
                                                </div>
                                                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                                                    {user?.primaryEmailAddress?.emailAddress}
                                                </div>
                                            </div>
                                            <Link href="#" className="rl-dropdown-item" onClick={() => setProfileOpen(false)}>
                                                <HelpCircle size={16} />
                                                Help Center
                                            </Link>
                                            <button className="rl-dropdown-item" onClick={() => setProfileOpen(false)}>
                                                <Bug size={16} />
                                                Report a Bug
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
