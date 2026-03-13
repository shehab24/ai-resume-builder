"use client";

import { useEffect, useState } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Loader2, MoreHorizontal, Search, Trash2, Shield, UserCog,
    Briefcase, AlertTriangle, Ban, CheckCircle, Activity, Clock, WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface User {
    id: string;
    name: string;
    email: string;
    role: "JOB_SEEKER" | "RECRUITER" | "ADMIN";
    country: string;
    createdAt: string;
    lastSeenAt: string | null;
    isBlocked: boolean;
    blockedUntil?: string;
    warningCount: number;
    _count: { postedJobs: number; applications: number };
}

function ActivityBadge({ lastSeenAt }: { lastSeenAt: string | null }) {
    if (!lastSeenAt) {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                <WifiOff className="h-3 w-3" />
                Never visited
            </span>
        );
    }

    const last = new Date(lastSeenAt);
    const now  = new Date();
    const diffMs = now.getTime() - last.getTime();
    const diffH  = diffMs / (1000 * 60 * 60);

    if (diffH < 24) {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Active today
            </span>
        );
    }
    if (diffH < 24 * 7) {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                This week
            </span>
        );
    }
    if (diffH < 24 * 30) {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600">
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                This month
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
            <Clock className="h-3 w-3" />
            Inactive
        </span>
    );
}

export default function UserManagementPage() {
    const [users, setUsers]       = useState<User[]>([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState("");
    const [roleFilter, setRoleFilter]         = useState("ALL");
    const [activityFilter, setActivityFilter] = useState("ALL");
    const [page, setPage]         = useState(1);
    const [totalPages, setTotalPages]   = useState(1);
    const [totalUsers, setTotalUsers]   = useState(0);

    // Moderation state
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isWarnOpen,  setIsWarnOpen]    = useState(false);
    const [isBlockOpen, setIsBlockOpen]   = useState(false);
    const [warnReason,  setWarnReason]    = useState("");
    const [blockDuration, setBlockDuration] = useState("7");
    const [processing, setProcessing]     = useState(false);

    useEffect(() => {
        const t = setTimeout(fetchUsers, 400);
        return () => clearTimeout(t);
    }, [search, roleFilter, activityFilter, page]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                role: roleFilter,
                activity: activityFilter,
            });
            if (search) params.append("search", search);

            const res  = await fetch(`/api/admin/users?${params}`);
            if (!res.ok) throw new Error("Failed to fetch users");

            const data = await res.json();
            setUsers(data.users);
            setTotalPages(data.pagination.pages);
            setTotalUsers(data.pagination.total);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        try {
            const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed to delete user"); }
            toast.success("User deleted successfully");
            fetchUsers();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete user");
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            if (!res.ok) throw new Error("Failed to update role");
            toast.success("User role updated");
            fetchUsers();
        } catch { toast.error("Failed to update user role"); }
    };

    const handleWarnUser = async () => {
        if (!selectedUser || !warnReason) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}/moderation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "WARN", reason: warnReason }),
            });
            if (!res.ok) throw new Error();
            toast.success("Warning sent to user");
            setIsWarnOpen(false); setWarnReason(""); fetchUsers();
        } catch { toast.error("Failed to warn user"); }
        finally { setProcessing(false); }
    };

    const handleBlockUser = async () => {
        if (!selectedUser) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}/moderation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "BLOCK", duration: blockDuration }),
            });
            if (!res.ok) throw new Error();
            toast.success("User blocked successfully");
            setIsBlockOpen(false); fetchUsers();
        } catch { toast.error("Failed to block user"); }
        finally { setProcessing(false); }
    };

    const handleUnblockUser = async (userId: string) => {
        if (!confirm("Unblock this user?")) return;
        try {
            const res = await fetch(`/api/admin/users/${userId}/moderation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "UNBLOCK" }),
            });
            if (!res.ok) throw new Error();
            toast.success("User unblocked");
            fetchUsers();
        } catch { toast.error("Failed to unblock user"); }
    };

    const activityOptions = [
        { value: "ALL",           label: "All Users" },
        { value: "active-today",  label: "🟢 Active Today (24h)" },
        { value: "active-week",   label: "🔵 Active This Week" },
        { value: "active-month",  label: "🟣 Active This Month" },
        { value: "never-visited", label: "⚫ Never Visited" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
                <p className="text-gray-500 mt-1">
                    {totalUsers} user{totalUsers !== 1 ? "s" : ""} found · sorted by most recently active
                </p>
            </div>

            {/* Filters bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Search */}
                <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="pl-10"
                    />
                </div>

                {/* Role */}
                <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Roles</SelectItem>
                        <SelectItem value="JOB_SEEKER">Job Seekers</SelectItem>
                        <SelectItem value="RECRUITER">Recruiters</SelectItem>
                        <SelectItem value="ADMIN">Admins</SelectItem>
                    </SelectContent>
                </Select>

                {/* Activity */}
                <Select value={activityFilter} onValueChange={(v) => { setActivityFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-full sm:w-52">
                        <Activity className="h-4 w-4 mr-2 text-gray-400" />
                        <SelectValue placeholder="Activity" />
                    </SelectTrigger>
                    <SelectContent>
                        {activityOptions.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-900/40">
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>
                                <span className="flex items-center gap-1.5">
                                    <Activity className="h-3.5 w-3.5 text-blue-500" />
                                    Last Seen
                                </span>
                            </TableHead>
                            <TableHead>Account Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-gray-400 text-sm">
                                    No users found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow
                                    key={user.id}
                                    className={user.isBlocked ? "bg-red-50/60 dark:bg-red-900/10" : ""}
                                >
                                    {/* User info */}
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                                {user.name || <span className="text-gray-400 italic">No name</span>}
                                                {user.isBlocked && <Ban className="h-3 w-3 text-red-500" />}
                                            </span>
                                            <span className="text-sm text-gray-500 font-mono">{user.email}</span>
                                            {user.country && (
                                                <span className="text-xs text-gray-400">{user.country}</span>
                                            )}
                                            <span className="text-xs text-gray-400">
                                                {user.role === "RECRUITER" && `${user._count.postedJobs} job${user._count.postedJobs !== 1 ? "s" : ""} posted`}
                                                {user.role === "JOB_SEEKER" && `${user._count.applications} application${user._count.applications !== 1 ? "s" : ""}`}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Role */}
                                    <TableCell>
                                        <Badge
                                            variant={
                                                user.role === "ADMIN"     ? "destructive"
                                              : user.role === "RECRUITER" ? "default"
                                              : "secondary"
                                            }
                                        >
                                            {user.role === "JOB_SEEKER" ? "Job Seeker" : user.role}
                                        </Badge>
                                    </TableCell>

                                    {/* Last Seen */}
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <ActivityBadge lastSeenAt={user.lastSeenAt} />
                                            {user.lastSeenAt && (
                                                <span className="text-xs text-gray-400">
                                                    {formatDistanceToNow(new Date(user.lastSeenAt), { addSuffix: true })}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Account Status */}
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {user.isBlocked ? (
                                                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 w-fit">
                                                    Blocked
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 w-fit">
                                                    Active
                                                </Badge>
                                            )}
                                            {user.warningCount > 0 && (
                                                <span className="text-xs text-orange-600 flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    {user.warningCount} warning{user.warningCount > 1 ? "s" : ""}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>


                                    {/* Joined */}
                                    <TableCell className="text-sm text-gray-400 whitespace-nowrap">
                                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)}>
                                                    Copy Email
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />

                                                <DropdownMenuLabel>Moderation</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsWarnOpen(true); }}>
                                                    <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" /> Warn User
                                                </DropdownMenuItem>
                                                {user.isBlocked ? (
                                                    <DropdownMenuItem onClick={() => handleUnblockUser(user.id)}>
                                                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Unblock User
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsBlockOpen(true); }}>
                                                        <Ban className="mr-2 h-4 w-4 text-red-600" /> Block User
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, "JOB_SEEKER")}>
                                                    <UserCog className="mr-2 h-4 w-4" /> Make Job Seeker
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, "RECRUITER")}>
                                                    <Briefcase className="mr-2 h-4 w-4" /> Make Recruiter
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, "ADMIN")} className="text-red-600">
                                                    <Shield className="mr-2 h-4 w-4" /> Make Admin
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                    Showing {users.length} of {totalUsers} users
                </span>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                        Previous
                    </Button>
                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                        Next
                    </Button>
                </div>
            </div>

            {/* Warn Dialog */}
            <Dialog open={isWarnOpen} onOpenChange={setIsWarnOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Warn User: {selectedUser?.name}</DialogTitle>
                        <DialogDescription>Send a formal warning. The user will receive a notification.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <Label htmlFor="reason">Warning Reason</Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g., Violation of community guidelines."
                            value={warnReason}
                            onChange={(e) => setWarnReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsWarnOpen(false)}>Cancel</Button>
                        <Button onClick={handleWarnUser} disabled={processing || !warnReason} className="bg-orange-600 hover:bg-orange-700">
                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                            Send Warning
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Block Dialog */}
            <Dialog open={isBlockOpen} onOpenChange={setIsBlockOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Block User: {selectedUser?.name}</DialogTitle>
                        <DialogDescription>Blocking prevents the user from accessing the platform.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <Label htmlFor="duration">Block Duration</Label>
                        <Select value={blockDuration} onValueChange={setBlockDuration}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">24 Hours</SelectItem>
                                <SelectItem value="3">3 Days</SelectItem>
                                <SelectItem value="7">7 Days</SelectItem>
                                <SelectItem value="30">30 Days</SelectItem>
                                <SelectItem value="PERMANENT">Permanent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBlockOpen(false)}>Cancel</Button>
                        <Button onClick={handleBlockUser} disabled={processing} variant="destructive">
                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
                            Block User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
