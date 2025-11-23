"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        fetchNotifications();
        // Poll every 5 seconds for faster updates
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();

                // Filter notifications based on current view
                const isRecruiterView = pathname?.startsWith("/dashboard/recruiter");
                const filteredData = data.filter((n: Notification) => {
                    if (isRecruiterView) {
                        return n.type === "APPLICATION_RECEIVED";
                    } else {
                        return n.type === "STATUS_UPDATE" || n.type === "TASK_ASSIGNED" || n.type === "JOB_POSTED";
                    }
                });

                setNotifications(filteredData);
                setUnreadCount(filteredData.filter((n: Notification) => !n.isRead).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            try {
                await fetch(`/api/notifications/${notification.id}/read`, { method: "PATCH" });
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error("Failed to mark as read", error);
            }
        }

        if (notification.link) {
            router.push(notification.link);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-background" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications
                    </div>
                ) : (
                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={cn(
                                    "flex flex-col items-start p-3 cursor-pointer",
                                    !notification.isRead && "bg-muted/50"
                                )}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex w-full justify-between gap-2">
                                    <span className="font-medium text-sm">{notification.title}</span>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(notification.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {notification.message}
                                </p>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
