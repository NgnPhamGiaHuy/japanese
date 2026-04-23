"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
    BellOff,
    Check,
    CheckCheck,
    MessageSquare,
    Shield,
    Trash2,
    UserPlus,
    X,
} from "lucide-react";

import {
    deleteAllNotifications,
    deleteNotification,
    isUnread,
    logNotificationDeleted,
    logNotificationRead,
    logNotificationsCleared,
    logNotificationsReadAll,
    markAllNotificationsRead,
    markNotificationRead,
    useNotifications,
} from "@/features/notifications";
import { auth } from "@/lib/firebase";
import { ScreenHeader } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { useAppStore } from "@/store";

import type {
    AppNotification,
    NotificationGroup,
    NotificationType,
} from "@/features/notifications";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function resolveLink(n: AppNotification): string {
    return n.data?.shareLink ?? n.link ?? "/flashcard";
}

// ─── Icon per type ────────────────────────────────────────────────────────────

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

// ─── Accept / Decline buttons for invite notifications ────────────────────────

function InviteActions({
    notification,
    userId,
    onDone,
}: {
    notification: AppNotification;
    userId: string;
    onDone: () => void;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const link = resolveLink(notification);

    const handleAccept = () => {
        startTransition(async () => {
            await markNotificationRead(userId, notification.id);
            void auth.currentUser
                ?.getIdToken()
                .then((token) =>
                    logNotificationRead(
                        token,
                        userId,
                        notification.id,
                        notification.type,
                        notification.title,
                    ),
                );
            onDone();
            router.push(link);
        });
    };

    const handleDecline = () => {
        startTransition(async () => {
            await deleteNotification(userId, notification.id);
            void auth.currentUser
                ?.getIdToken()
                .then((token) =>
                    logNotificationDeleted(
                        token,
                        userId,
                        notification.id,
                        notification.type,
                        notification.title,
                    ),
                );
            onDone();
        });
    };

    return (
        <div className="mt-3 flex gap-2">
            <Button
                onClick={handleAccept}
                loading={isPending}
                variant="primary"
                className="!flex-1 !rounded-xl !px-3 !py-2 !text-xs !font-black"
                icon={Check}
                iconSize={13}
            >
                Accept
            </Button>
            <Button
                onClick={handleDecline}
                loading={isPending}
                variant="secondary"
                className="!flex-1 !rounded-xl !border-gray-300 !px-3 !py-2 !text-xs !font-black"
                icon={X}
                iconSize={13}
            >
                Decline
            </Button>
        </div>
    );
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotificationRow({
    notification,
    userId,
    onRefresh,
}: {
    notification: AppNotification;
    userId: string;
    onRefresh: () => void;
}) {
    const router = useRouter();
    const [isDeleting, startDeleteTransition] = useTransition();
    const unread = isUnread(notification);
    const link = resolveLink(notification);

    const handleContentClick = () => {
        if (unread) {
            void markNotificationRead(userId, notification.id);
            void auth.currentUser
                ?.getIdToken()
                .then((token) =>
                    logNotificationRead(
                        token,
                        userId,
                        notification.id,
                        notification.type,
                        notification.title,
                    ),
                );
        }
        router.push(link);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        startDeleteTransition(async () => {
            await deleteNotification(userId, notification.id);
            void auth.currentUser
                ?.getIdToken()
                .then((token) =>
                    logNotificationDeleted(
                        token,
                        userId,
                        notification.id,
                        notification.type,
                        notification.title,
                    ),
                );
        });
    };

    return (
        <div
            className={`group relative px-4 py-3.5 transition-colors ${
                unread ? "bg-blue-50/50" : "hover:bg-gray-50"
            } ${isDeleting ? "pointer-events-none opacity-40" : ""}`}
        >
            {/* Unread dot */}
            {unread && (
                <span className="absolute top-4 left-1.5 h-2 w-2 rounded-full bg-[#1cb0f6]" />
            )}

            {/* Top row: icon + text content + delete button */}
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="mt-0.5 shrink-0">
                    <NotificationIcon type={notification.type} />
                </div>

                {/* Text content — plain div, clickable via onClick */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={handleContentClick}
                    onKeyDown={(e) => e.key === "Enter" && handleContentClick()}
                    className="min-w-0 flex-1 cursor-pointer"
                >
                    <div className="flex items-start justify-between gap-2">
                        <p
                            className={`text-sm leading-snug ${
                                unread
                                    ? "font-black text-[#3c3c3c]"
                                    : "font-semibold text-[#3c3c3c]"
                            }`}
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

                {/* Delete button — sibling of content div, never nested inside it */}
                <Button
                    variant="ghost"
                    onClick={handleDelete}
                    aria-label="Dismiss notification"
                    className="!mt-0.5 !shrink-0 !rounded-lg !p-1.5 !text-gray-300 opacity-0 shadow-none transition-all group-hover:opacity-100 hover:!bg-red-50 hover:!text-[#ea2b2b] hover:shadow-none focus:opacity-100 active:translate-y-0"
                    icon={Trash2}
                    iconSize={15}
                />
            </div>

            {/* Invite action buttons — rendered OUTSIDE the text div, never nested in it */}
            {notification.type === "invite" && unread && (
                <div className="mt-1 pl-[52px]">
                    <InviteActions notification={notification} userId={userId} onDone={onRefresh} />
                </div>
            )}
        </div>
    );
}

// ─── Group section ────────────────────────────────────────────────────────────

function NotificationGroupSection({
    group,
    userId,
    onRefresh,
}: {
    group: NotificationGroup;
    userId: string;
    onRefresh: () => void;
}) {
    return (
        <div>
            <div className="sticky top-[57px] z-10 bg-[#F7F7F8] px-4 py-2">
                <span className="text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                    {group.label}
                </span>
            </div>
            <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
                {group.items.map((n, i) => (
                    <div key={n.id}>
                        <NotificationRow notification={n} userId={userId} onRefresh={onRefresh} />
                        {i < group.items.length - 1 && <div className="mx-4 h-px bg-gray-100" />}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonRows() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="animate-pulse overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-4"
                >
                    <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200" />
                        <div className="flex-1 space-y-2 pt-1">
                            <div className="h-3.5 w-32 rounded bg-gray-200" />
                            <div className="h-3 w-48 rounded bg-gray-100" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: "all" | "unread" }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gray-100">
                {filter === "unread" ? (
                    <Check size={36} className="text-gray-300" />
                ) : (
                    <BellOff size={36} className="text-gray-300" />
                )}
            </div>
            <h2 className="mb-1 text-xl font-black text-[#3c3c3c]">
                {filter === "unread" ? "You're all caught up! 🎉" : "No notifications yet"}
            </h2>
            <p className="max-w-xs font-bold text-[#afafaf]">
                {filter === "unread"
                    ? "No unread notifications right now."
                    : "Invites, comments, and replies will appear here."}
            </p>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
    const { user } = useAppStore();
    const { notifications, groups, loading, unreadCount } = useNotifications();
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [isMarkingAll, startMarkAll] = useTransition();
    const [isClearingAll, startClearAll] = useTransition();

    // Filtered view for "unread" tab
    const displayedGroups =
        filter === "unread"
            ? groups
                  .map((g) => ({ ...g, items: g.items.filter(isUnread) }))
                  .filter((g) => g.items.length > 0)
            : groups;

    const totalDisplayed = displayedGroups.reduce((sum, g) => sum + g.items.length, 0);

    const handleMarkAllRead = () => {
        if (!user || unreadCount === 0) return;
        const count = unreadCount;
        startMarkAll(async () => {
            await markAllNotificationsRead(user.uid);
            void auth.currentUser
                ?.getIdToken()
                .then((token) => logNotificationsReadAll(token, user.uid, count));
        });
    };

    const handleClearAll = () => {
        if (!user || notifications.length === 0) return;
        const count = notifications.length;
        startClearAll(async () => {
            await deleteAllNotifications(user.uid);
            void auth.currentUser
                ?.getIdToken()
                .then((token) => logNotificationsCleared(token, user.uid, count));
        });
    };

    // Passed to child rows so invite accept/decline can trigger a no-op refresh
    // (real-time listener handles the actual update)
    const noop = () => {};

    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8] pb-28">
            <ScreenHeader
                title="Notifications"
                backHref="/"
                right={
                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                onClick={handleMarkAllRead}
                                loading={isMarkingAll}
                                className="!flex !items-center !gap-1 !rounded-xl !px-2.5 !py-2 !text-xs !font-black !text-[#1cb0f6] shadow-none transition-colors hover:!bg-blue-50 hover:shadow-none active:translate-y-0"
                                title="Mark all as read"
                                icon={CheckCheck}
                                iconSize={15}
                            >
                                <span className="hidden sm:inline">All read</span>
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button
                                variant="ghost"
                                onClick={handleClearAll}
                                loading={isClearingAll}
                                className="!flex !items-center !gap-1 !rounded-xl !px-2.5 !py-2 !text-xs !font-black !text-gray-400 shadow-none transition-colors hover:!bg-red-50 hover:!text-[#ea2b2b] hover:shadow-none active:translate-y-0"
                                title="Clear all notifications"
                                icon={Trash2}
                                iconSize={15}
                            >
                                <span className="hidden sm:inline">Clear</span>
                            </Button>
                        )}
                    </div>
                }
                rightWrapperClassName="flex items-center"
            />

            <div className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
                {/* Filter tabs */}
                <div className="flex gap-2">
                    {(["all", "unread"] as const).map((f) => {
                        const isActive = filter === f;
                        return (
                            <Button
                                key={f}
                                onClick={() => setFilter(f)}
                                variant={isActive ? "primary" : "ghost"}
                                className={`!rounded-xl !px-4 !py-2 !text-sm !font-black capitalize shadow-none transition-colors hover:shadow-none active:translate-y-0 ${
                                    isActive ? "" : "!bg-white !text-gray-500 hover:!bg-gray-100"
                                }`}
                            >
                                {f}
                                {f === "unread" && unreadCount > 0 && (
                                    <span
                                        className={`ml-1.5 rounded-full px-1.5 py-px text-[10px] ${
                                            isActive ? "bg-white/30" : "bg-gray-100"
                                        }`}
                                    >
                                        {unreadCount}
                                    </span>
                                )}
                            </Button>
                        );
                    })}
                </div>

                {/* Content */}
                {loading ? (
                    <SkeletonRows />
                ) : totalDisplayed === 0 ? (
                    <EmptyState filter={filter} />
                ) : (
                    <div className="space-y-4">
                        {displayedGroups.map((group) => (
                            <NotificationGroupSection
                                key={group.label}
                                group={group}
                                userId={user!.uid}
                                onRefresh={noop}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
