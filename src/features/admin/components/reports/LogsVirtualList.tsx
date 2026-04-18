"use client";

import { useRef } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";

import LogRow from "./LogRow";

import type { AdminLog } from "../../types";

interface LogsVirtualListProps {
    logs: AdminLog[];
}

/**
 * Log Virtualization List.
 *
 * @remarks Efficiently renders large log datasets using windowing (@tanstack/react-virtual).
 * This ensures smooth scrolling even with thousands of operational entries.
 */
const LogsVirtualList = ({ logs }: LogsVirtualListProps) => {
    const parentRef = useRef<HTMLDivElement | null>(null);
    const rowVirtualizer = useVirtualizer({
        count: logs.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 108,
        overscan: 12,
        measureElement: (el) => el.getBoundingClientRect().height,
    });

    return (
        <div ref={parentRef} className="max-h-[70vh] overflow-auto">
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    position: "relative",
                    width: "100%",
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const log = logs[virtualItem.index];
                    return (
                        <div
                            key={virtualItem.key}
                            data-index={virtualItem.index}
                            ref={rowVirtualizer.measureElement}
                            className="absolute top-0 left-0 w-full"
                            style={{ transform: `translateY(${virtualItem.start}px)` }}
                        >
                            <LogRow log={log} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LogsVirtualList;
