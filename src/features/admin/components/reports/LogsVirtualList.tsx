"use client";

import { useRef } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";

import LogRow from "./LogRow";

import type { AdminLog } from "../../types";

interface LogsVirtualListProps {
    logs: AdminLog[];
}

/**
 * Log list — genuinely windowed via `@tanstack/react-virtual`.
 *
 * @remarks
 * Previously rendered every row in `logs` unconditionally despite its name
 * and docstring claiming virtualization — this is the real thing. Rows have
 * variable height (`LogRow` expands on click to show entity/metadata detail),
 * so sizing uses dynamic measurement (`measureElement` + a ResizeObserver
 * under the hood) rather than a fixed row height: each row's actual
 * rendered height is measured after paint and on every subsequent resize,
 * including the expand/collapse toggle.
 *
 * Virtualization needs a bounded, scrollable container to window against —
 * this component now owns that (it previously had no height at all, letting
 * the full unbounded list flow into the page).
 *
 * @example
 * <LogsVirtualList logs={adminLogs} />
 */
const LogsVirtualList = ({ logs }: LogsVirtualListProps) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: logs.length,
        getScrollElement: () => parentRef.current,
        // Collapsed LogRow height — corrected per-row after first paint via measureElement.
        estimateSize: () => 92,
        overscan: 6,
        getItemKey: (index) => logs[index].id,
    });

    return (
        // Inline style, not a Tailwind class: this container's height is
        // functionally load-bearing for the virtualizer's own measurement
        // (getScrollElement().clientHeight), not just cosmetic — it must
        // resolve to a real numeric value in any environment, including a
        // test runner that doesn't load the app's compiled Tailwind CSS.
        <div ref={parentRef} style={{ maxHeight: 600, overflowY: "auto" }}>
            <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
                {virtualizer.getVirtualItems().map((virtualItem) => (
                    <div
                        key={virtualItem.key}
                        data-index={virtualItem.index}
                        ref={virtualizer.measureElement}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualItem.start}px)`,
                        }}
                    >
                        <LogRow log={logs[virtualItem.index]} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LogsVirtualList;
