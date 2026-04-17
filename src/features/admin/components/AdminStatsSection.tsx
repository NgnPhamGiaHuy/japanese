"use client";

import { Crown, ShieldCheck, ShieldOff, Users, Zap } from "lucide-react";

import { StatCard } from "@/shared/components/ui";

import type { AdminStats } from "../types";

interface AdminStatsSectionProps {
    stats: AdminStats | null;
    loading: boolean;
}

export function AdminStatsSection({ stats, loading }: AdminStatsSectionProps) {
    const display = (val: number | undefined) => (loading ? "…" : (val ?? 0));

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard
                icon={<Users className="h-8 w-8 text-[#1cb0f6]" />}
                title="Total Users"
                value={display(stats?.totalUsers)}
            />
            <StatCard
                icon={<Zap className="h-8 w-8 text-[#58cc02]" />}
                title="Active"
                value={display(stats?.activeUsers)}
            />
            <StatCard
                icon={<Crown className="h-8 w-8 text-[#ce82ff]" />}
                title="Superadmins"
                value={display(stats?.superAdmins)}
            />
            <StatCard
                icon={<ShieldCheck className="h-8 w-8 text-[#1cb0f6]" />}
                title="Admins"
                value={display(stats?.admins)}
            />
            <StatCard
                icon={<ShieldOff className="h-8 w-8 text-[#afafaf]" />}
                title="Disabled"
                value={display(stats?.disabledUsers)}
            />
        </div>
    );
}
