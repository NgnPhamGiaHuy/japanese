"use client";

import { useTranslations } from "next-intl";

import { Trophy } from "lucide-react";

import { scoreToTier, TIER_INFO } from "@/features/game/domain";
import { useLeaderboard } from "@/features/game/hooks";

interface LeaderboardProps {
    gameMode: string | null;
    currentUserId?: string;
    accentColor?: string;
}

const MEDALS = ["🥇", "🥈", "🥉"];

const Skeleton = () => (
    <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
            <div
                key={i}
                className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3"
                style={{ opacity: 1 - i * 0.15 }}
            >
                <div className="h-5 w-5 animate-pulse rounded-full bg-gray-200" />
                <div className="h-4 flex-1 animate-pulse rounded-full bg-gray-200" />
                <div className="h-4 w-10 animate-pulse rounded-full bg-gray-200" />
            </div>
        ))}
    </div>
);

const Leaderboard = ({ gameMode, currentUserId, accentColor = "#ff9600" }: LeaderboardProps) => {
    const t = useTranslations("Game");
    const tCommon = useTranslations("Common");
    const { entries, loading, error } = useLeaderboard(gameMode);

    return (
        <div className="w-full">
            <div className="mb-3 flex items-center gap-2">
                <Trophy size={16} className="shrink-0" style={{ color: accentColor }} />
                <span
                    className="text-sm font-black tracking-widest uppercase"
                    style={{ color: accentColor }}
                >
                    {t("leaderboard")}
                </span>
            </div>

            {error && (
                <p className="text-muted rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold">
                    {t("leaderboardError")}
                </p>
            )}

            {loading && !error && <Skeleton />}

            {!loading && !error && entries.length === 0 && (
                <div className="rounded-2xl bg-white px-4 py-6 text-center">
                    <p className="text-muted text-sm font-bold">{t("noScoresYet")}</p>
                    <p className="mt-0.5 text-xs font-bold text-[#c8c8c8]">{t("beFirstOnBoard")}</p>
                </div>
            )}

            {!loading && !error && entries.length > 0 && (
                <div className="space-y-1.5">
                    {entries.map((entry, i) => {
                        const isMe = entry.userId === currentUserId;
                        const medal = MEDALS[i];
                        return (
                            <div
                                key={entry.userId}
                                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors ${
                                    isMe ? "border-2 bg-white font-black" : "bg-white"
                                }`}
                                style={isMe ? { borderColor: accentColor } : undefined}
                            >
                                <span className="w-6 shrink-0 text-center text-base">
                                    {medal ?? (
                                        <span className="text-muted text-xs font-black">
                                            #{i + 1}
                                        </span>
                                    )}
                                </span>

                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                    <div
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                                        style={{ backgroundColor: isMe ? accentColor : "#c8c8c8" }}
                                    >
                                        {entry.displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <span
                                        className={`truncate text-sm ${isMe ? "text-text font-black" : "text-text font-bold"}`}
                                    >
                                        {entry.displayName}
                                        {isMe && (
                                            <span className="ml-1 text-xs font-bold opacity-50">
                                                ({tCommon("you")})
                                            </span>
                                        )}
                                    </span>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    {(() => {
                                        const t = scoreToTier(entry.score);
                                        const ti = TIER_INFO[t];
                                        return (
                                            <span
                                                className="rounded-lg px-1.5 py-0.5 text-xs font-black"
                                                style={{ color: ti.color, backgroundColor: ti.bg }}
                                            >
                                                {ti.emoji}
                                            </span>
                                        );
                                    })()}
                                    <span
                                        className={`text-base ${isMe ? "font-black" : "text-text font-bold"}`}
                                        style={isMe ? { color: accentColor } : undefined}
                                    >
                                        {entry.score}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
