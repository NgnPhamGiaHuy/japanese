"use client";

import { Layers } from "lucide-react";

import { AdminStatCard } from "../shared";

interface ContentOverviewStatsProps {
    totalDecks: number;
}

/**
 * High-level Content Statistics for the Admin View.
 *
 * @remarks Displays key metrics about global deck distribution.
 * Strictly presentational.
 *
 * "Ghost Decks" and "Platform Utilization" tiles were removed here: neither
 * corresponded to a real, defined metric — "Ghost Decks" was `filteredCount - 2`
 * (unexplained magic-number arithmetic on the current search-filtered count,
 * not an orphaned-deck concept) and "Platform Utilization" was a hardcoded
 * "98%". Re-add only once a real metric backs them.
 */
export const ContentOverviewStats = ({ totalDecks }: ContentOverviewStatsProps) => {
    return (
        <div className="grid grid-cols-1">
            <AdminStatCard
                label="Global Decks"
                value={totalDecks}
                icon={Layers}
                color="text-both"
            />
        </div>
    );
};
