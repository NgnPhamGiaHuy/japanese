"use client";

import { Card } from "@/shared/components/ui";

interface SystemHealthCardProps {
    errorRate: number;
    activeAdmins: number;
}

/**
 * System Health Monitoring Card.
 *
 * @remarks Displays real-time operational metrics like error rate and administrative presence.
 * Uses conditional styling to highlight high error rates.
 */
const SystemHealthCard = ({ errorRate, activeAdmins }: SystemHealthCardProps) => {
    return (
        <Card variant="dashboard" className="border-2 border-gray-100 bg-gray-50/30">
            <h3 className="mb-4 text-xs font-black tracking-widest text-[#3c3c3c] uppercase">
                System Health
            </h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#afafaf]">Error Rate</span>
                    <span
                        className={
                            errorRate > 2
                                ? "font-black text-[#ea2b2b]"
                                : "font-black text-[#58cc02]"
                        }
                    >
                        {errorRate}%
                    </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                        className="h-full bg-[#ea2b2b] transition-all"
                        style={{ width: `${Math.min(errorRate * 10, 100)}%` }}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#afafaf]">Active Admins</span>
                    <span className="font-black text-[#3c3c3c]">{activeAdmins}</span>
                </div>
            </div>
        </Card>
    );
};

export default SystemHealthCard;
