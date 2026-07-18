"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { useWindowVirtualizer } from "@tanstack/react-virtual";

import { NotificationRow } from "@/features/notifications/components";
import { flattenNotificationGroups } from "@/features/notifications/domain/format";
import { useNow } from "@/shared/hooks";

import type { NotificationGroup } from "@/features/notifications/types";

interface NotificationsVirtualListProps {
    groups: NotificationGroup[];
    userId: string;
}

/**
 * Windowed, time-grouped notification list — real virtualization via
 * `@tanstack/react-virtual`, so an inbox grown well past the original
 * hard `limit(50)` (see NotificationsContext's loadMore) doesn't render every
 * row.
 *
 * @remarks
 * Uses `useWindowVirtualizer` rather than a fixed-height inner scroller
 * (unlike LogsVirtualList): this is a full page-scroll inbox, not a bounded
 * dashboard panel, and the layout has no wrapping `overflow` container to
 * window against — the browser window itself is the scrollable element.
 *
 * Rows have variable height (invite rows grow by an Accept/Decline row;
 * collapsed notifications grow by an avatar-stack row), so sizing uses
 * dynamic measurement (`measureElement`) rather than a fixed row height, same
 * as LogsVirtualList.
 *
 * Trade-off: group headers ("Today" / "Yesterday" / "Earlier") no longer stay
 * pinned while their group scrolls by. Keeping them pinned under
 * virtualization needs TanStack's separate "active sticky index" recipe
 * (rendering the current header outside the normal transform stack) — real
 * extra edge-case surface (resize, fast-scroll, pre-measurement races) for a
 * cosmetic nicety on what's normally a short, personal list. Left as a plain
 * inline label that scrolls with its group.
 */
const NotificationsVirtualList = ({ groups, userId }: NotificationsVirtualListProps) => {
    const now = useNow(30_000);
    const listRef = useRef<HTMLDivElement>(null);
    const [scrollMargin, setScrollMargin] = useState(0);

    // Measured synchronously post-mount (before paint) — the list rarely sits
    // at the very top of the page (ScreenHeader + filter tabs sit above it),
    // and a stale scrollMargin of 0 would misplace the first computed window.
    useLayoutEffect(() => {
        setScrollMargin(listRef.current?.offsetTop ?? 0);
    }, []);

    const flatItems = useMemo(() => flattenNotificationGroups(groups), [groups]);

    const virtualizer = useWindowVirtualizer({
        count: flatItems.length,
        estimateSize: (index) => (flatItems[index].kind === "header" ? 40 : 88),
        overscan: 8,
        getItemKey: (index) => flatItems[index].key,
        scrollMargin,
    });

    return (
        <div ref={listRef} style={{ position: "relative", height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
                const item = flatItems[virtualItem.index];
                return (
                    <div
                        key={virtualItem.key}
                        data-index={virtualItem.index}
                        ref={virtualizer.measureElement}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualItem.start - scrollMargin}px)`,
                        }}
                    >
                        {item.kind === "header" ? (
                            <div className="px-4 py-2">
                                <span className="text-muted text-xs font-black tracking-widest uppercase">
                                    {item.label}
                                </span>
                            </div>
                        ) : (
                            <div
                                className={`border-x-2 border-gray-200 bg-white ${
                                    item.isFirstInGroup ? "rounded-t-2xl border-t-2" : ""
                                } ${item.isLastInGroup ? "rounded-b-2xl border-b-2 shadow-sm" : ""}`}
                            >
                                <NotificationRow
                                    notification={item.notification}
                                    userId={userId}
                                    now={now}
                                />
                                {!item.isLastInGroup && <div className="mx-4 h-px bg-gray-100" />}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default NotificationsVirtualList;
