"use client";

import { Card } from "@/shared/components/ui";

interface AdminTableProps {
    children: React.ReactNode;
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
 */
const AdminTable = ({
    children,
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
            {toolbar && <div className="h-16 border-b-2 border-gray-100">{toolbar}</div>}

            <div className={`overflow-x-auto ${containerClassName}`}>
                <table className="w-full border-collapse text-left">{children}</table>
            </div>

            {pagination && pagination}
        </Card>
    );
};

export default AdminTable;
