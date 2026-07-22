"use client";

import AdminTableShell from "./AdminTableShell";

interface AdminTableProps {
    children: React.ReactNode;
    mobileList?: React.ReactNode;
    toolbar?: React.ReactNode;
    pagination?: React.ReactNode;
}

/**
 * Standardized `<table>`-based shell for admin data grids.
 *
 * @remarks Composes AdminTableShell (the Card container, border treatments,
 * and toolbar/pagination/mobileList chrome shared by every admin data
 * surface) with the `<table>` element itself. Use AdminTableShell directly
 * for non-table content that still wants the same chrome (e.g. Reports'
 * virtualized log list).
 */
const AdminTable = ({ children, mobileList, toolbar, pagination }: AdminTableProps) => {
    return (
        <AdminTableShell mobileList={mobileList} toolbar={toolbar} pagination={pagination}>
            <table className="w-full border-collapse text-left">{children}</table>
        </AdminTableShell>
    );
};

export default AdminTable;
