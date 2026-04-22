/**
 * Visual tier indicator based on game or study performance.
 *
 * @remarks
 * Shows an emoji and themed background (e.g., Gold, Platinum) based on the provided score.
 * Reusable across features displaying achievement tiers.
 *
 * @example
 * <TierBadge score={950} />
 */
import { scoreToTier, TIER_INFO } from "@/features/game";

/** Attributes for rendering a TierBadge. */
export interface TierBadgeProps {
    /** The numerical score used to determine the tier. */
    score: number;
    /** Additional CSS classes. */
    className?: string;
}

const TierBadge = ({ score, className = "" }: TierBadgeProps) => {
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
};

export default TierBadge;
