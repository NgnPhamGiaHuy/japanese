"use client";

import { useTranslations } from "next-intl";

import { LoadingSpinner } from "@/shared/components/ui";

import type { Row, Table } from "@tanstack/react-table";

interface DataTableMobileListProps<T> {
    table: Table<T>;
    /** Each table keeps its own custom mobile-card visual design (e.g. avatar/status for Users) — this just supplies the shared iterate/loading/divider chrome. */
    renderRow: (row: Row<T>) => React.ReactNode;
    loading?: boolean;
    loadingLabel?: string;
}

/**
 * Shared mobile card-list body for admin tables — generalizes the
 * `loading ? <Spinner/> : rows.map(...)` block that was inlined directly in
 * `UsersTable.tsx`. Pass the result as `AdminTable`'s `mobileList` prop.
 */
function DataTableMobileList<T>({
    table,
    renderRow,
    loading = false,
    loadingLabel,
}: DataTableMobileListProps<T>) {
    const t = useTranslations("AdminCommon");
    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <LoadingSpinner fullScreen={false} label={loadingLabel ?? t("loading")} />
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => (
                <div key={row.id}>{renderRow(row)}</div>
            ))}
        </div>
    );
}

export default DataTableMobileList;
