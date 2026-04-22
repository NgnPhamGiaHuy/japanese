"use client";

import { Card } from "@/shared/components/ui";

interface AdminTableProps {
    children: React.ReactNode;
    mobileList?: React.ReactNode;
    toolbar?: React.ReactNode;
    pagination?: React.ReactNode;
    className?: string;
    containerClassName?: string;
}

/**
 * Standardized Shell for Admin Tables.
 *
 * @remarks Provides the consistent Card container, border treatments,
 * and overflow handling for all administrative data grids.
 * Pass `mobileList` to render a card-based list on small screens instead
 * of the scrollable table.
 */
const AdminTable = ({
    children,
    mobileList,
    toolbar,
    pagination,
    className = "",
    containerClassName = "",
}: AdminTableProps) => {
    return (
        <Card
            variant="default"
            padding="none"
            className={`overflow-hidden border-2 border-b-8 border-gray-100 bg-white ${className}`}
        >
            {toolbar && <div className="border-b-2 border-gray-100">{toolbar}</div>}

            {/* Desktop: scrollable table */}
            <div
                className={`overflow-x-auto ${mobileList ? "hidden md:block" : ""} ${containerClassName}`}
            >
                <table className="w-full border-collapse text-left">{children}</table>
            </div>

            {/* Mobile: card list */}
            {mobileList && <div className="md:hidden">{mobileList}</div>}

            {pagination && pagination}
        </Card>
    );
};

export default AdminTable;
