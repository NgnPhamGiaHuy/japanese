"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface AdminPageHeaderProps {
    title: string;
    description: string;
    icon: LucideIcon;
    actions?: ReactNode;
}

/**
 * Admin Page Header.
 *
 * @remarks Standardized header for admin sub-pages. Includes an icon,
 * title, description, and optional action buttons for a consistent layout.
 */
const AdminPageHeader = ({ title, description, icon: Icon, actions }: AdminPageHeaderProps) => {
    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#1cb0f6] p-2.5 shadow-lg shadow-[#1cb0f6]/20">
                        <Icon className="text-white" size={20} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-[#3c3c3c]">{title}</h1>
                </div>
                <p className="mt-2 text-sm font-bold text-[#afafaf]">{description}</p>
            </div>
            {actions}
        </div>
    );
};

export default AdminPageHeader;
