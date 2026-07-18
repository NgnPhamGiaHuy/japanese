"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Trash2 } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/components/ui";
import { useAlert } from "@/shared/providers";
import InviteActions from "./InviteActions";
import NotificationIcon from "./NotificationIcon";
import { withFreshToken } from "./withFreshToken";
import { logNotificationDeleted, logNotificationRead } from "../actions/activity-log.actions";
import {
    formatRelativeTime,
    isCollapsed,
    overflowCount,
    resolveNotificationLink,
    visibleActors,
} from "../domain/format";
import { deleteNotification, markNotificationRead, restoreNotifications } from "../services";
import { isUnread } from "../types";

import type { AppNotification } from "../types";

/** Overlapping avatar stack + "+N" for a collapsed notification. */
const CollapsedActors = ({ notification }: { notification: AppNotification }) => {
    if (!isCollapsed(notification.count)) return null;
    const shown = visibleActors(notification.actors, 3);
    if (shown.length === 0) return null;
    const extra = overflowCount(notification.count, notification.actors, 3);
    return (
        <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex -space-x-2">
                {shown.map((a) =>
                    a.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            key={a.uid}
                            src={a.photoURL}
                            alt=""
                            className="h-5 w-5 rounded-full border-2 border-white object-cover"
                        />
                    ) : (
                        <span
                            key={a.uid}
                            className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[9px] font-black text-gray-600 uppercase"
                        >
                            {(a.name ?? "?").charAt(0)}
                        </span>
                    ),
                )}
            </div>
            {extra > 0 && <span className="text-[11px] font-bold text-gray-400">+{extra}</span>}
        </div>
    );
};

/** Single notification row — icon, text content, delete button, and invite actions if applicable. */
export function NotificationRow({
    notification,
    userId,
    now,
}: {
    notification: AppNotification;
    userId: string;
    now: number;
}) {
    const t = useTranslations("NotificationsPage");
    const tCommon = useTranslations("Common");
    const router = useRouter();
    const { showAlert } = useAlert();
    const [isDeleting, startDeleteTransition] = useTransition();
    const unread = isUnread(notification);
    const link = resolveNotificationLink(notification);

    const handleContentClick = () => {
        if (unread) {
            void markNotificationRead(userId, notification.id);
            void withFreshToken((token) =>
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
        const id = notification.id;
        startDeleteTransition(async () => {
            await deleteNotification(userId, id);
            void withFreshToken((token) =>
                logNotificationDeleted(token, userId, id, notification.type, notification.title),
            );
            // Offer Undo — the doc is only soft-deleted, so restore is instant.
            showAlert("info", t("dismissed"), {
                action: {
                    label: tCommon("undo"),
                    onClick: () => void restoreNotifications(userId, [id]),
                },
                durationMs: 6000,
            });
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
                <span className="bg-katakana absolute top-4 left-1.5 h-2 w-2 rounded-full">
                    <span className="sr-only">{t("unread")}</span>
                </span>
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
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleContentClick();
                        }
                    }}
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
                            {formatRelativeTime(notification.createdAt, now)}
                        </span>
                    </div>
                    <p className="mt-0.5 text-[13px] leading-snug text-gray-500">
                        {notification.message}
                    </p>
                    <CollapsedActors notification={notification} />
                </div>

                {/* Delete button — sibling of content div, never nested inside it.
                    Always visible on touch (no hover); hover-revealed on ≥sm. */}
                <Button
                    variant="plain"
                    size="auto"
                    onClick={handleDelete}
                    aria-label={t("dismiss")}
                    className="hover:text-danger mt-0.5 shrink-0 rounded-lg p-1.5 text-gray-300 opacity-100 shadow-none transition-all hover:bg-red-50 hover:shadow-none active:translate-y-0 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                    icon={Trash2}
                    iconSize={15}
                />
            </div>

            {/* Invite action buttons — rendered OUTSIDE the text div, never nested in it */}
            {notification.type === "invite" && unread && (
                <div className="mt-1 pl-13">
                    <InviteActions notification={notification} userId={userId} />
                </div>
            )}
        </div>
    );
}
