"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Trash2, Shield, UserCog, Briefcase, AlertTriangle, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface User {
    id: string;
    name: string;
    email: string;
    role: "JOB_SEEKER" | "RECRUITER" | "ADMIN";
    country: string;
    createdAt: string;
    isBlocked: boolean;
    blockedUntil?: string;
    warningCount: number;
    _count: {
        postedJobs: number;
        applications: number;
    };
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Moderation State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isWarnOpen, setIsWarnOpen] = useState(false);
    const [isBlockOpen, setIsBlockOpen] = useState(false);
    const [warnReason, setWarnReason] = useState("");
    const [blockDuration, setBlockDuration] = useState("7"); // Default 7 days
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search, roleFilter, page]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                role: roleFilter,
            });
            if (search) params.append("search", search);

            const res = await fetch(`/api/admin/users?${params}`);
            if (!res.ok) throw new Error("Failed to fetch users");

            const data = await res.json();
            setUsers(data.users);
            setTotalPages(data.pagination.pages);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete user");
            }

            toast.success("User deleted successfully");
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to delete user");
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
        } catch (error) {
            console.error(error);
            toast.error("Failed to update user role");
        }
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
            if (!res.ok) throw new Error("Failed to warn user");
            toast.success("Warning sent to user");
            setIsWarnOpen(false);
            setWarnReason("");
            fetchUsers();
        } catch (error) {
            toast.error("Failed to warn user");
        } finally {
            setProcessing(false);
        }
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
            if (!res.ok) throw new Error("Failed to block user");
            toast.success("User blocked successfully");
            setIsBlockOpen(false);
            fetchUsers();
        } catch (error) {
            toast.error("Failed to block user");
        } finally {
            setProcessing(false);
        }
    };

    const handleUnblockUser = async (userId: string) => {
        if (!confirm("Are you sure you want to unblock this user?")) return;
        try {
            const res = await fetch(`/api/admin/users/${userId}/moderation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "UNBLOCK" }),
            });
            if (!res.ok) throw new Error("Failed to unblock user");
            toast.success("User unblocked successfully");
            fetchUsers();
        } catch (error) {
            toast.error("Failed to unblock user");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
                <p className="text-gray-500 mt-2">Manage all users, recruiters, and admins.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Roles</SelectItem>
                        <SelectItem value="JOB_SEEKER">Job Seekers</SelectItem>
                        <SelectItem value="RECRUITER">Recruiters</SelectItem>
                        <SelectItem value="ADMIN">Admins</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Stats</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id} className={user.isBlocked ? "bg-red-50 dark:bg-red-900/10" : ""}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                {user.name || "No Name"}
                                                {user.isBlocked && <Ban className="h-3 w-3 text-red-600" />}
                                            </span>
                                            <span className="text-sm text-gray-500">{user.email}</span>
                                            {user.country && <span className="text-xs text-gray-400">{user.country}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {user.role === "ADMIN" ? (
                                            <Badge variant="destructive">
                                                ADMIN
                                            </Badge>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                <Badge
                                                    variant={user.role === "RECRUITER" ? "default" : "secondary"}
                                                >
                                                    {user.role === "RECRUITER" ? "Recruiter" : "Job Seeker"}
                                                </Badge>
                                                <span className="text-xs text-gray-400 italic">Can switch roles</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {user.isBlocked ? (
                                                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Blocked</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                                            )}
                                            {user.warningCount > 0 && (
                                                <span className="text-xs text-orange-600 flex items-center">
                                                    <AlertTriangle className="h-3 w-3 mr-1" /> {user.warningCount} Warnings
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-gray-500">
                                            {user.role === "RECRUITER" && (
                                                <div>Jobs: {user._count.postedJobs}</div>
                                            )}
                                            {user.role === "JOB_SEEKER" && (
                                                <div>Apps: {user._count.applications}</div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-500">
                                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                                    </TableCell>
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
            <div className="flex items-center justify-end space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Previous
                </Button>
                <span className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                >
                    Next
                </Button>
            </div>

            {/* Warn User Dialog */}
            <Dialog open={isWarnOpen} onOpenChange={setIsWarnOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Warn User: {selectedUser?.name}</DialogTitle>
                        <DialogDescription>
                            Send a formal warning to this user. They will receive a notification.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Warning Reason</Label>
                            <Textarea
                                id="reason"
                                placeholder="e.g., Violation of community guidelines regarding spam."
                                value={warnReason}
                                onChange={(e) => setWarnReason(e.target.value)}
                            />
                        </div>
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

            {/* Block User Dialog */}
            <Dialog open={isBlockOpen} onOpenChange={setIsBlockOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Block User: {selectedUser?.name}</DialogTitle>
                        <DialogDescription>
                            Blocking a user will prevent them from accessing the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="duration">Block Duration</Label>
                            <Select value={blockDuration} onValueChange={setBlockDuration}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">24 Hours</SelectItem>
                                    <SelectItem value="3">3 Days</SelectItem>
                                    <SelectItem value="7">7 Days</SelectItem>
                                    <SelectItem value="30">30 Days</SelectItem>
                                    <SelectItem value="PERMANENT">Permanent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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
