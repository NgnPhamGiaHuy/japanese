"use client";

import { Card } from "@/shared/components/ui";

interface AdminCardProps {
    title?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    padding?: "none" | "default";
    className?: string;
}

/**
 * Standardized Admin Card with consistent header typography.
 *
 * @remarks Use this for dashboard widgets and specialized content blocks
 * that aren't tables.
 */
const AdminCard = ({
    title,
    children,
    actions,
    padding = "default",
    className = "",
}: AdminCardProps) => {
    return (
        <Card
            variant="default"
            padding="none"
            className={`overflow-hidden border-2 border-b-8 border-gray-100 bg-white ${className}`}
        >
            {title && (
                <div className="flex items-center justify-between border-b-2 border-gray-50 bg-gray-50/30 px-6 py-4">
                    <h2 className="text-xs font-black tracking-widest text-[#3c3c3c] uppercase">
                        {title}
                    </h2>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            )}
            <div className={padding === "default" ? "p-6" : ""}>{children}</div>
        </Card>
    );
};

export default AdminCard;
