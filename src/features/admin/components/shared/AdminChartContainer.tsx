"use client";

import { Card } from "@/shared/components/ui";

interface AdminChartContainerProps {
    title: string;
    children: React.ReactNode;
    subtitle?: string;
    className?: string;
    chartHeight?: number;
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
}: AdminChartContainerProps) => {
    return (
        <Card className={`border-gray-100 p-6 ${className}`}>
            <div className="mb-6 flex flex-col gap-1">
                <h3 className="text-xs font-black tracking-widest text-muted uppercase">
                    {title}
                </h3>
                {subtitle && (
                    <p className="text-xs leading-none font-bold text-muted uppercase">
                        {subtitle}
                    </p>
                )}
            </div>
            <div style={{ height: chartHeight }} className="w-full">
                {children}
            </div>
        </Card>
    );
};

export default AdminChartContainer;
