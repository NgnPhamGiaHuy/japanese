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
    const accent = color ?? "text-[#1cb0f6]";
    return (
        <Card className="border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] font-black tracking-widest text-[#afafaf] uppercase">
                        {label}
                    </p>
                    <p className="mt-2 text-3xl font-black text-[#3c3c3c]">{value}</p>
                    {trend ? (
                        <p
                            className={`mt-1 text-xs font-black ${trend.isPositive ? "text-[#58cc02]" : "text-[#ea2b2b]"}`}
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
