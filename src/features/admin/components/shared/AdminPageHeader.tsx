"use client";

import { useTranslations } from "next-intl";

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
    const t = useTranslations("AdminCommon");
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="bg-katakana shadow-katakana/20 shrink-0 rounded-2xl p-2 shadow-lg sm:p-2.5">
                        <Icon className="text-white" size={18} />
                    </div>
                    <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                        <h1 className="text-text text-2xl font-black tracking-tighter sm:text-3xl">
                            {title}
                        </h1>
                        {isLive && (
                            <div className="bg-hiragana/10 flex items-center gap-1.5 rounded-full px-2.5 py-1">
                                <span className="bg-hiragana h-1.5 w-1.5 animate-pulse rounded-full" />
                                <span className="text-hiragana text-xs font-black tracking-widest uppercase">
                                    {t("live")}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-muted mt-1.5 text-sm font-bold">{description}</p>
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
};

export default AdminPageHeader;
