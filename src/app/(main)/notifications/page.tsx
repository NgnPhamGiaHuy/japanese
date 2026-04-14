"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Bell, BellOff, Check, CheckCheck, MessageSquare, Shield, UserPlus } from "lucide-react";

import {
    markAllNotificationsRead,
    markNotificationRead,
    useNotifications,
} from "@/features/notifications";
import { ScreenHeader } from "@/shared/components/layout";
import { useAppStore } from "@/store";

import type { AppNotification, NotificationType } from "@/features/notifications";

// ─── Icon per notification type ───────────────────────────────────────────────

function NotificationIcon({ type }: { type: NotificationType }) {
    const base = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full";
    switch (type) {
        case "invite":
            return (
                <div className={`${base} bg-blue-100 text-blue-600`}>
                    <UserPlus size={18} />
                </div>
            );
        case "comment":
            return (
                <div className={`${base} bg-purple-100 text-purple-600`}>
                    <MessageSquare size={18} />
                </div>
            );
        case "reply":
            return (
                <div className={`${base} bg-green-100 text-green-600`}>
                    <MessageSquare size={18} />
                </div>
            );
        case "role_change":
            return (
                <div className={`${base} bg-amber-100 text-amber-600`}>
                    <Shield size={18} />
                </div>
            );
    }
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotificationRow({
    notification,
    onRead,
}: {
    notification: AppNotification;
    onRead: (id: string) => void;
}) {
    return (
        <Link
            href={notification.link}
            onClick={() => !notification.read && onRead(notification.id)}
            className={`flex items-start gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-gray-50 ${
                !notification.read ? "bg-blue-50/40" : ""
            }`}
        >
            <NotificationIcon type={notification.type} />

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <p
                        className={`text-sm leading-snug ${!notification.read ? "font-black text-[#3c3c3c]" : "font-bold text-[#3c3c3c]"}`}
                    >
                        {notification.title}
                    </p>
                    <span className="shrink-0 text-[11px] text-gray-400">
                        {relativeTime(notification.createdAt)}
                    </span>
                </div>
                <p className="mt-0.5 text-[13px] leading-snug text-gray-500">
                    {notification.message}
                </p>
            </div>

            {!notification.read && (
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1cb0f6]" />
            )}
        </Link>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
    const { user } = useAppStore();
    const { notifications, loading, unreadCount } = useNotifications();
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [markingAll, setMarkingAll] = useState(false);

    const displayed = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

    const handleRead = async (id: string) => {
        if (!user) return;
        await markNotificationRead(user.uid, id);
    };

    const handleMarkAllRead = async () => {
        if (!user || unreadCount === 0) return;
        setMarkingAll(true);
        try {
            await markAllNotificationsRead(user.uid);
        } finally {
            setMarkingAll(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8] pb-28">
            <ScreenHeader
                title="Notifications"
                backHref="/"
                right={
                    unreadCount > 0 ? (
                        <button
                            onClick={() => void handleMarkAllRead()}
                            disabled={markingAll}
                            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-[#1cb0f6] transition-colors hover:bg-blue-50 disabled:opacity-50"
                            title="Mark all as read"
                        >
                            <CheckCheck size={16} />
                            All read
                        </button>
                    ) : undefined
                }
            />

            <div className="mx-auto max-w-2xl px-4 pt-4">
                {/* Filter tabs */}
                <div className="mb-4 flex gap-2">
                    {(["all", "unread"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`rounded-xl px-4 py-2 text-sm font-black capitalize transition-colors ${
                                filter === f
                                    ? "bg-[#1cb0f6] text-white"
                                    : "bg-white text-gray-500 hover:bg-gray-100"
                            }`}
                        >
                            {f}
                            {f === "unread" && unreadCount > 0 && (
                                <span className="ml-1.5 rounded-full bg-white/30 px-1.5 py-px text-[10px]">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse rounded-2xl bg-white p-4">
                                <div className="flex gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 rounded bg-gray-200" />
                                        <div className="h-3 w-48 rounded bg-gray-100" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gray-100">
                            {filter === "unread" ? (
                                <Check size={36} className="text-gray-300" />
                            ) : (
                                <BellOff size={36} className="text-gray-300" />
                            )}
                        </div>
                        <h2 className="mb-1 text-xl font-black text-[#3c3c3c]">
                            {filter === "unread" ? "All caught up!" : "No notifications yet"}
                        </h2>
                        <p className="font-bold text-[#afafaf]">
                            {filter === "unread"
                                ? "You have no unread notifications."
                                : "Notifications about invites, comments, and replies will appear here."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
                        {displayed.map((n, i) => (
                            <div key={n.id}>
                                <NotificationRow notification={n} onRead={handleRead} />
                                {i < displayed.length - 1 && (
                                    <div className="mx-4 h-px bg-gray-100" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
