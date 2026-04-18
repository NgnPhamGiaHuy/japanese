"use client";

import type { ReactNode } from "react";

interface AdminPageLayoutProps {
    children: ReactNode;
}

/**
 * Admin Page Layout Wrapper.
 *
 * @remarks Standardizes padding and vertical spacing for all admin pages,
 * ensuring visual consistency across the internal operations dashboard.
 */
const AdminPageLayout = ({ children }: AdminPageLayoutProps) => {
    return <div className="space-y-8 p-6 md:p-10">{children}</div>;
};

export default AdminPageLayout;
