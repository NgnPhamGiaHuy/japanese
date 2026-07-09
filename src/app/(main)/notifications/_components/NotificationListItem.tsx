"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Check, MessageSquare, Shield, Trash2, UserPlus, X } from "lucide-react";

import {
    logNotificationDeleted,
    logNotificationRead,
} from "@/features/notifications/actions/activity-log.actions";
import { deleteNotification, markNotificationRead } from "@/features/notifications/services";
import { isUnread } from "@/features/notifications/types";
import { auth } from "@/lib/firebase";
import { SCREEN_HEADER_HEIGHT_CLASS } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";

import type {
    AppNotification,
    NotificationGroup,
    NotificationType,
} from "@/features/notifications/types";

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

/** Accept / Decline buttons for invite notifications. */
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

/** Single notification row — icon, text content, delete button, and invite actions if applicable. */
export function NotificationRow({
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
                <span className="bg-katakana absolute top-4 left-1.5 h-2 w-2 rounded-full" />
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
                    className="focus-visible:ring-katakana min-w-0 flex-1 cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                    <div className="flex items-start justify-between gap-2">
                        <p
                            className={`text-sm leading-snug ${
                                unread ? "text-text font-black" : "text-text font-semibold"
                            }`}
                        >
                            {notification.title}
                        </p>
                        <span className="shrink-0 text-xs text-gray-400">
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
                    className="hover:!text-danger !mt-0.5 !shrink-0 !rounded-lg !p-1.5 !text-gray-300 opacity-0 shadow-none transition-all group-hover:opacity-100 hover:!bg-red-50 hover:shadow-none focus:opacity-100 active:translate-y-0"
                    icon={Trash2}
                    iconSize={15}
                />
            </div>

            {/* Invite action buttons — rendered OUTSIDE the text div, never nested in it */}
            {notification.type === "invite" && unread && (
                <div className="mt-1 pl-13">
                    <InviteActions notification={notification} userId={userId} onDone={onRefresh} />
                </div>
            )}
        </div>
    );
}

/** Sticky-labeled group of notification rows (e.g. "Today", "This week"). */
export function NotificationGroupSection({
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
            <div className={`sticky ${SCREEN_HEADER_HEIGHT_CLASS} bg-bg z-10 px-4 py-2`}>
                <span className="text-muted text-xs font-black tracking-widest uppercase">
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
