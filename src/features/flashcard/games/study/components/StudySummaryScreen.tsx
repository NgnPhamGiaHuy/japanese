"use client";

import { hexToThemeColor } from "@/features/flashcard/utils";
import { StatGrid } from "@/features/game";
import { Button } from "@/shared/components/ui";

import type { LucideIcon } from "lucide-react";
import type { StatItem } from "@/features/game";

interface StudySummaryScreenProps {
    icon: LucideIcon;
    /** Matches the other session icons' strokeWidth={3} unless a mode needs its own (Mistake Review's Brain icon uses 2.5). */
    iconStrokeWidth?: number;
    title: string;
    subtitle: React.ReactNode;
    themeHex: string;
    stats: StatItem[];
    xpEarned: number;
    onComplete: () => void;
}

/**
 * End-of-session reward screen shared by every study-mode player. Each mode
 * supplies its own icon, copy, and already-computed stats/XP — the formulas
 * behind those numbers (accuracy %, XP-per-correct multiplier, etc.) differ
 * per mode and stay in the caller, not here.
 */
const StudySummaryScreen = ({
    icon: Icon,
    iconStrokeWidth = 3,
    title,
    subtitle,
    themeHex,
    stats,
    xpEarned,
    onComplete,
}: StudySummaryScreenProps) => (
    <div className="bg-bg fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center">
        <div
            className="mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-4xl border-b-8 shadow-sm"
            style={{ backgroundColor: themeHex, borderColor: `${themeHex}AA` }}
        >
            <Icon size={48} className="text-white" strokeWidth={iconStrokeWidth} />
        </div>
        <h2 className="text-text mb-1 text-4xl font-black">{title}</h2>
        <p className="text-muted mb-8 text-lg font-bold">{subtitle}</p>
        <div className="mb-10 w-full max-w-sm">
            <StatGrid variant="large" className="flex w-full gap-4" stats={stats} />
        </div>
        <Button
            variant="primary"
            color={hexToThemeColor(themeHex)}
            onClick={onComplete}
            className="w-full max-w-xs py-5 text-xl"
        >
            Collect +{xpEarned} XP
        </Button>
    </div>
);

export default StudySummaryScreen;
