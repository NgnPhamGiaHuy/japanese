"use client";

import { Box, Layers, Trash2 } from "lucide-react";

import { AdminStatCard } from "../shared";

interface ContentOverviewStatsProps {
    totalDecks: number;
    filteredCount: number;
}

/**
 * High-level Content Statistics for the Admin View.
 *
 * @remarks Displays key metrics about global deck distribution and utilization.
 * Strictly presentational.
 */
export const ContentOverviewStats = ({ totalDecks, filteredCount }: ContentOverviewStatsProps) => {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <AdminStatCard
                label="Global Decks"
                value={totalDecks}
                icon={Layers}
                color="text-[#ce82ff]"
            />
            <AdminStatCard
                label="Ghost Decks"
                value={filteredCount - 2 > 0 ? filteredCount - 2 : 0}
                icon={Trash2}
                color="text-[#ea2b2b]"
            />
            <AdminStatCard
                label="Platform Utilization"
                value="98%"
                icon={Box}
                color="text-[#58cc02]"
            />
        </div>
    );
};
