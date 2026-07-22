"use client";

import { Card } from "@/shared/components/ui";

interface AdminChartContainerProps {
    title: string;
    children: React.ReactNode;
    subtitle?: string;
    className?: string;
    chartHeight?: number;
    /** Renders `emptyMessage` in place of `children` — the source has no data (ADR-114), not a true zero. */
    isEmpty?: boolean;
    emptyMessage?: string;
}

/**
 * Standardized Container for Admin Dashboards Charts.
 *
 * @remarks Wraps Recharts components with consistent typography,
 * padding, and thematic card styling.
 */
const AdminChartContainer = ({
    title,
    children,
    subtitle,
    className = "",
    chartHeight = 280,
    isEmpty = false,
    emptyMessage,
}: AdminChartContainerProps) => {
    return (
        <Card className={`border-gray-100 p-6 ${className}`}>
            <div className="mb-6 flex flex-col gap-1">
                <h3 className="text-muted text-xs font-black tracking-widest uppercase">{title}</h3>
                {subtitle && (
                    <p className="text-muted text-xs leading-none font-bold uppercase">
                        {subtitle}
                    </p>
                )}
            </div>
            <div style={{ height: chartHeight }} className="w-full">
                {isEmpty ? (
                    <div className="text-muted flex h-full items-center justify-center text-center text-sm font-bold italic">
                        {emptyMessage}
                    </div>
                ) : (
                    children
                )}
            </div>
        </Card>
    );
};

export default AdminChartContainer;
