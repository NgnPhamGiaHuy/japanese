"use client";

import { useState, useTransition } from "react";

import { CheckCheck, Trash2 } from "lucide-react";

import {
    logNotificationsCleared,
    logNotificationsReadAll,
} from "@/features/notifications/actions/activity-log.actions";
import {
    deleteAllNotifications,
    markAllNotificationsRead,
} from "@/features/notifications/services";
import { useNotifications } from "@/features/notifications/context/NotificationsContext";
import { isUnread } from "@/features/notifications/types";
import { useAppStore } from "@/lib/app-store";
import { auth } from "@/lib/firebase";
import { ScreenHeader } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { NotificationGroupSection } from "./_components/NotificationListItem";
import { NotificationsEmptyState, SkeletonRows } from "./_components/NotificationsPlaceholders";

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
        <div className="bg-bg min-h-dvh pb-28">
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
                                className="!text-katakana !flex !items-center !gap-1 !rounded-xl !px-2.5 !py-2 !text-xs !font-black shadow-none transition-colors hover:!bg-blue-50 hover:shadow-none active:translate-y-0"
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
                                className="hover:!text-danger !flex !items-center !gap-1 !rounded-xl !px-2.5 !py-2 !text-xs !font-black !text-gray-400 shadow-none transition-colors hover:!bg-red-50 hover:shadow-none active:translate-y-0"
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
                                        className={`ml-1.5 rounded-full px-1.5 py-px text-xs ${
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
                    <NotificationsEmptyState filter={filter} />
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
