"use client";

import { ReactNode } from "react";

import { LucideIcon } from "lucide-react";

interface AdminPageHeaderProps {
    title: string;
    description: string;
    icon: LucideIcon;
    actions?: ReactNode;
    isLive?: boolean;
}

/**
 * Admin Page Header.
 *
 * @remarks Standardized header for admin sub-pages. Includes an icon,
 * title, description, and optional action buttons for a consistent layout.
 * Supports a 'Live' mode for real-time monitoring sections.
 */
const AdminPageHeader = ({
    title,
    description,
    icon: Icon,
    actions,
    isLive = false,
}: AdminPageHeaderProps) => {
    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#1cb0f6] p-2.5 shadow-lg shadow-[#1cb0f6]/20">
                        <Icon className="text-white" size={20} />
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black tracking-tighter text-[#3c3c3c]">
                            {title}
                        </h1>
                        {isLive && (
                            <div className="flex items-center gap-1.5 rounded-full bg-[#58cc02]/10 px-2.5 py-1">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#58cc02]" />
                                <span className="text-[10px] font-black tracking-widest text-[#58cc02] uppercase">
                                    Live
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <p className="mt-2 text-sm font-bold text-[#afafaf]">{description}</p>
            </div>
            {actions}
        </div>
    );
};

export default AdminPageHeader;
