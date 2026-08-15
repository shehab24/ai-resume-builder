"use client";

import { useEffect } from "react";

/**
 * Invisible component — fires a lightweight POST to /api/user/ping
 * on mount (i.e., on every dashboard page load) to update lastSeenAt.
 * This powers the DAU / WAU / MAU metrics in the admin dashboard.
 */
export default function UserPing() {
    useEffect(() => {
        fetch("/api/user/ping", { method: "POST" }).catch(() => {
            // Silent fail — never interrupt the user experience
        });
    }, []);

    return null;
}
