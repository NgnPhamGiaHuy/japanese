"use client";

import { useTranslations } from "next-intl";

interface AdminBulkActionsBarProps {
    count: number;
    children: React.ReactNode;
    onCancel: () => void;
    className?: string;
}

/**
 * Standardized Bulk Actions Bar for Admin Tables.
 *
 * @remarks Displays a thematic overlay indicating selected row count
 * and providing contextual action buttons.
 */
const AdminBulkActionsBar = ({
    count,
    children,
    onCancel,
    className = "",
}: AdminBulkActionsBarProps) => {
    const t = useTranslations("AdminCommon");
    const tCommon = useTranslations("Common");
    return (
        <div className={`bg-katakana/5 flex h-full items-center justify-between px-4 ${className}`}>
            <div className="flex items-center gap-3">
                <div className="bg-katakana flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-white">
                    {count}
                </div>
                <span className="text-katakana text-sm font-black">
                    {t("selectedCount", { count })}
                </span>
            </div>
            <div className="flex items-center gap-2">
                {children}
                <button
                    onClick={onCancel}
                    className="text-muted hover:text-text ml-2 text-xs font-bold"
                >
                    {tCommon("cancel")}
                </button>
            </div>
        </div>
    );
};

export default AdminBulkActionsBar;
