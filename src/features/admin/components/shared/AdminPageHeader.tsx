"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

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
 * @remarks Responsive header: stacks vertically on mobile, side-by-side on md+.
 * Title scales from text-2xl on mobile to text-3xl on md+.
 */
const AdminPageHeader = ({
    title,
    description,
    icon: Icon,
    actions,
    isLive = false,
}: AdminPageHeaderProps) => {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="shrink-0 rounded-2xl bg-[#1cb0f6] p-2 shadow-lg shadow-[#1cb0f6]/20 sm:p-2.5">
                        <Icon className="text-white" size={18} />
                    </div>
                    <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                        <h1 className="text-2xl font-black tracking-tighter text-[#3c3c3c] sm:text-3xl">
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
                <p className="mt-1.5 text-sm font-bold text-[#afafaf]">{description}</p>
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
};

export default AdminPageHeader;
