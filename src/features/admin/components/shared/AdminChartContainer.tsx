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
                <h3 className="text-xs font-black tracking-[0.2em] text-[#afafaf] uppercase">
                    {title}
                </h3>
                {subtitle && (
                    <p className="text-[10px] leading-none font-bold text-[#afafaf] uppercase">
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
