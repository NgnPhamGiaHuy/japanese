/**
 * TierBadge — Visual tier indicator based on score
 *
 * @remarks
 * Shows emoji + theme colors (Gold, Platinum, etc) for game achievements.
 * Reusable across all features that display tier/score information.
 */

import { scoreToTier, TIER_INFO } from "@/features/game";

export interface TierBadgeProps {
    score: number;
    className?: string;
}

export function TierBadge({ score, className = "" }: TierBadgeProps) {
    const tier = scoreToTier(score);
    const info = TIER_INFO[tier];
    return (
        <span
            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-black shadow-sm ${className}`}
            style={{
                backgroundColor: info.bg,
                color: info.color,
                border: `1px solid ${info.border}`,
            }}
        >
            {info.emoji}
        </span>
    );
}
