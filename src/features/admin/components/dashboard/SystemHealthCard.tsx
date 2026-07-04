"use client";

import { AdminCard } from "../shared";

interface SystemHealthCardProps {
    errorRate: number;
    activeAdmins: number;
    activeSuperAdmins: number;
}

/**
 * System Health Monitoring Card.
 *
 * @remarks Displays real-time operational metrics like error rate and administrative presence.
 * Uses conditional styling to highlight high error rates.
 */
const SystemHealthCard = ({
    errorRate,
    activeAdmins,
    activeSuperAdmins,
}: SystemHealthCardProps) => {
    return (
        <AdminCard title="System Health">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted">Error Rate</span>
                    <span
                        className={
                            errorRate > 2
                                ? "font-black text-danger"
                                : "font-black text-hiragana"
                        }
                    >
                        {errorRate}%
                    </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                        className="h-full bg-danger transition-all"
                        style={{ width: `${Math.min(errorRate * 10, 100)}%` }}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted">Active Team</span>
                    <span className="font-black text-text">
                        {activeAdmins}A / {activeSuperAdmins}S
                    </span>
                </div>
            </div>
        </AdminCard>
    );
};

export default SystemHealthCard;
