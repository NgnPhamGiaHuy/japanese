/**
 * Tier system for competitive game modes.
 *
 * Score thresholds are shared across Match and Speed modes — the same effort
 * benchmarks apply regardless of mode, making cross-mode comparison intuitive.
 */

export type Tier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

const THRESHOLDS: Array<[number, Tier]> = [
    [4000, "diamond"],
    [2000, "platinum"],
    [1000, "gold"],
    [500, "silver"],
    [0, "bronze"],
];

export function scoreToTier(score: number): Tier {
    for (const [threshold, tier] of THRESHOLDS) {
        if (score >= threshold) return tier;
    }
    return "bronze";
}

export interface TierInfo {
    /** Key into the Game.tier.* messages — the display label is resolved by the
     *  rendering component, since a plain data module can't call useTranslations(). */
    id: Tier;
    color: string;
    bg: string;
    border: string;
    emoji: string;
    nextThreshold: number | null;
}

export const TIER_INFO: Record<Tier, TierInfo> = {
    bronze: {
        id: "bronze",
        color: "#cd7f32",
        bg: "#fdf3e8",
        border: "#e8a87c",
        emoji: "🥉",
        nextThreshold: 500,
    },
    silver: {
        id: "silver",
        color: "#9e9e9e",
        bg: "#f5f5f5",
        border: "#bdbdbd",
        emoji: "🥈",
        nextThreshold: 1000,
    },
    gold: {
        id: "gold",
        color: "#ff9600",
        bg: "#fff8e8",
        border: "#ffd166",
        emoji: "🥇",
        nextThreshold: 2000,
    },
    platinum: {
        id: "platinum",
        color: "#1cb0f6",
        bg: "#e8f8ff",
        border: "#7dd8fa",
        emoji: "💎",
        nextThreshold: 4000,
    },
    diamond: {
        id: "diamond",
        color: "#ce82ff",
        bg: "#f8f0ff",
        border: "#ce82ff",
        emoji: "💠",
        nextThreshold: null,
    },
};
