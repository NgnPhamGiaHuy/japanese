"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";

import { CheckCheck, Trash2 } from "lucide-react";

import { useAppStore } from "@/lib/app-store";
import { auth } from "@/lib/firebase";
import { ScreenHeader } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { useAlert } from "@/shared/providers";
import { NotificationsEmptyState, SkeletonRows } from "./NotificationsPlaceholders";
import NotificationsVirtualList from "./NotificationsVirtualList";
import { logNotificationsCleared, logNotificationsReadAll } from "../actions/activity-log.actions";
import { useNotifications } from "../context/NotificationsContext";
import {
    deleteAllNotifications,
    markAllNotificationsRead,
    restoreNotifications,
} from "../services";
import { isUnread } from "../types";

/** Full inbox screen: filter state, unread rule, mark-all-read + clear-all-with-undo orchestration. */
export default function NotificationsInbox() {
    const t = useTranslations("NotificationsPage");
    const tCommon = useTranslations("Common");
    const { user } = useAppStore();
    const {
        notifications,
        groups,
        loading,
        loadingMore,
        hasMore,
        loadMore,
        unreadCount,
        error,
        retry,
    } = useNotifications();
    const { showAlert } = useAlert();
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [isMarkingAll, startMarkAll] = useTransition();
    const [isClearingAll, startClearAll] = useTransition();

    // Filtered view for "unread" tab
    const displayedGroups = useMemo(
        () =>
            filter === "unread"
                ? groups
                      .map((g) => ({ ...g, items: g.items.filter(isUnread) }))
                      .filter((g) => g.items.length > 0)
                : groups,
        [filter, groups],
    );

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
        const uid = user.uid;
        startClearAll(async () => {
            const clearedIds = await deleteAllNotifications(uid);
            void auth.currentUser
                ?.getIdToken()
                .then((token) => logNotificationsCleared(token, uid, clearedIds.length));
            if (clearedIds.length > 0) {
                showAlert("info", t("cleared", { count: clearedIds.length }), {
                    action: {
                        label: tCommon("undo"),
                        onClick: () => void restoreNotifications(uid, clearedIds),
                    },
                    durationMs: 8000,
                });
            }
        });
    };

    return (
        <div className="bg-bg min-h-dvh pb-28">
            <ScreenHeader
                title={t("title")}
                backHref="/"
                right={
                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                            <Button
                                variant="plain"
                                size="auto"
                                onClick={handleMarkAllRead}
                                loading={isMarkingAll}
                                className="text-katakana flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-black shadow-none transition-colors hover:bg-blue-50 hover:shadow-none active:translate-y-0"
                                title={t("markAllRead")}
                                icon={CheckCheck}
                                iconSize={15}
                            >
                                <span className="hidden sm:inline">{t("allRead")}</span>
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button
                                variant="plain"
                                size="auto"
                                onClick={handleClearAll}
                                loading={isClearingAll}
                                className="hover:text-danger flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-black text-gray-400 shadow-none transition-colors hover:bg-red-50 hover:shadow-none active:translate-y-0"
                                title={t("clearAllTitle")}
                                icon={Trash2}
                                iconSize={15}
                            >
                                <span className="hidden sm:inline">{t("clear")}</span>
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
                                {t(`filters.${f}`)}
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
                {error && !loading ? (
                    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-12 text-center">
                        <p className="text-sm font-bold text-gray-500">{t("loadError")}</p>
                        <Button
                            variant="plain"
                            size="auto"
                            onClick={retry}
                            className="text-katakana rounded-xl px-4 py-2 text-sm font-black hover:bg-gray-100 active:bg-gray-200"
                        >
                            {t("tryAgain")}
                        </Button>
                    </div>
                ) : loading ? (
                    <SkeletonRows />
                ) : (
                    <div className="space-y-4">
                        {totalDisplayed === 0 ? (
                            <NotificationsEmptyState filter={filter} />
                        ) : (
                            <NotificationsVirtualList groups={displayedGroups} userId={user!.uid} />
                        )}
                        {/* Independent of totalDisplayed/filter: the "unread"
                            tab filters the already-loaded window client-side,
                            so it can show zero matches here while older,
                            not-yet-loaded notifications (possibly unread)
                            still exist beyond it. */}
                        {hasMore && (
                            <div className="flex justify-center pb-4">
                                <Button
                                    variant="secondary"
                                    onClick={loadMore}
                                    loading={loadingMore}
                                    className="!rounded-xl !px-6 !py-2.5 !text-sm !font-black"
                                >
                                    {t("loadMore")}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
