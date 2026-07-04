"use client";

import { Card } from "@/shared/components/ui";

import type { LucideIcon } from "lucide-react";

interface AdminStatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color?: string;
    trend?: { value: number; isPositive: boolean };
}

/**
 * Admin Statistical Summary Card.
 *
 * @remarks Displays high-level KPIs with optional trend indicators.
 * Used primarily on the overview dashboard for quick-glance metrics.
 */
const AdminStatCard = ({ label, value, icon: Icon, color, trend }: AdminStatCardProps) => {
    const accent = color ?? "text-katakana";
    return (
        <Card className="border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted text-xs font-black tracking-widest uppercase">
                        {label}
                    </p>
                    <p className="text-text mt-2 text-3xl font-black">{value}</p>
                    {trend ? (
                        <p
                            className={`mt-1 text-xs font-black ${trend.isPositive ? "text-hiragana" : "text-danger"}`}
                        >
                            {trend.isPositive ? "↑" : "↓"} {trend.value}%
                        </p>
                    ) : null}
                </div>
                <div className={`rounded-2xl bg-current/10 p-3 ${accent}`}>
                    <Icon size={20} />
                </div>
            </div>
        </Card>
    );
};

export default AdminStatCard;
