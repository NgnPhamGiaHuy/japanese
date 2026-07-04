"use client";

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
    return (
        <div
            className={`flex h-full items-center justify-between bg-katakana/5 px-4 ${className}`}
        >
            <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-katakana text-xs font-black text-white">
                    {count}
                </div>
                <span className="text-sm font-black text-katakana">{count} selected</span>
            </div>
            <div className="flex items-center gap-2">
                {children}
                <button
                    onClick={onCancel}
                    className="ml-2 text-xs font-bold text-muted hover:text-text"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default AdminBulkActionsBar;
