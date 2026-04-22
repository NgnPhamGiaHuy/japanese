"use client";

import type { ReactNode } from "react";

interface AdminPageLayoutProps {
    children: ReactNode;
}

/**
 * Admin Page Layout Wrapper.
 *
 * @remarks Standardizes padding and vertical spacing for all admin pages.
 * Uses tighter spacing on mobile (p-4 gap-6) and more generous on desktop (p-10 gap-8).
 */
const AdminPageLayout = ({ children }: AdminPageLayoutProps) => {
    return <div className="flex flex-col gap-6 p-4 md:gap-8 md:p-10">{children}</div>;
};

export default AdminPageLayout;
