"use client";

import { useRef } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";

import LogRow from "./LogRow";
import { useDataTable } from "../../hooks/useDataTable";

import type { ColumnDef } from "@tanstack/react-table";
import type { AdminLog } from "../../types";

interface LogsVirtualListProps {
    logs: AdminLog[];
}

// LogRow renders one log as a single unified card (badges, expand/collapse,
// metadata grid) — there is no per-column cell layout to define, unlike
// Users/Content's real multi-column tables. This placeholder column exists
// only so `useDataTable` has the ≥1 column @tanstack/react-table requires;
// its `cell` is never rendered (LogsVirtualList reads `row.original`
// directly, it never calls `flexRender`).
const LOG_ROW_COLUMN: ColumnDef<AdminLog>[] = [{ id: "log", accessorFn: (log) => log }];

/**
 * Log list — genuinely windowed via `@tanstack/react-virtual`, now sourcing
 * its rows through the shared `useDataTable` engine (T-111a) instead of
 * iterating the raw `logs` array directly, so "how does an admin grid
 * behave" has one answer across Users/Content/Reports rather than two.
 *
 * @remarks
 * Same external prop interface and rendered output as before this migration
 * — `enableSorting`/`enableFiltering` are both off since neither is wired to
 * anything here (Reports' filtering is a server round-trip via
 * `AdminLogFilters` → `applyLogFilters`, same as before; sorting has never
 * existed). `getRowId` is load-bearing, not cosmetic: the virtualizer caches
 * each row's measured height by this ID, and `useDataTable`'s default
 * (index-based) `row.id` would let a taller/shorter log at the same index
 * after a page/filter change reuse the wrong cached height.
 *
 * Rows have variable height (`LogRow` expands on click to show entity/metadata
 * detail), so sizing uses dynamic measurement (`measureElement` + a
 * ResizeObserver under the hood) rather than a fixed row height: each row's
 * actual rendered height is measured after paint and on every subsequent
 * resize, including the expand/collapse toggle.
 *
 * Virtualization needs a bounded, scrollable container to window against —
 * this component owns that.
 *
 * @example
 * <LogsVirtualList logs={adminLogs} />
 */
const LogsVirtualList = ({ logs }: LogsVirtualListProps) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const { table } = useDataTable<AdminLog>({
        data: logs,
        columns: LOG_ROW_COLUMN,
        enableFiltering: false,
        enableSorting: false,
        getRowId: (log) => log.id,
    });
    const rows = table.getRowModel().rows;

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        // Collapsed LogRow height — corrected per-row after first paint via measureElement.
        estimateSize: () => 92,
        overscan: 6,
        getItemKey: (index) => rows[index].id,
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
                        <LogRow log={rows[virtualItem.index].original} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LogsVirtualList;
