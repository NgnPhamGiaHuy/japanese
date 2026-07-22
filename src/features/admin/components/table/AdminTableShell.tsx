"use client";

import { Card } from "@/shared/components/ui";

interface AdminTableShellProps {
    children: React.ReactNode;
    mobileList?: React.ReactNode;
    toolbar?: React.ReactNode;
    pagination?: React.ReactNode;
}

/**
 * Standardized Card/toolbar/pagination shell for admin data surfaces.
 *
 * @remarks
 * Table-agnostic — `children` renders as-is inside the scrollable desktop
 * region, so both `<table>`-based grids (via `AdminTable`, which composes
 * this) and non-table content (e.g. Reports' virtualized `LogsVirtualList`)
 * can share the same chrome instead of each forking it.
 */
const AdminTableShell = ({ children, mobileList, toolbar, pagination }: AdminTableShellProps) => {
    return (
        <Card
            variant="default"
            padding="none"
            className="overflow-hidden border-2 border-b-8 border-gray-100 bg-white"
        >
            {toolbar && <div className="border-b-2 border-gray-100">{toolbar}</div>}

            {/* Desktop: scrollable region */}
            <div className={`overflow-x-auto ${mobileList ? "hidden md:block" : ""}`}>
                {children}
            </div>

            {/* Mobile: card list */}
            {mobileList && <div className="md:hidden">{mobileList}</div>}

            {pagination && pagination}
        </Card>
    );
};

export default AdminTableShell;
