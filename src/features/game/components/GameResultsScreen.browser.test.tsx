/**
 * @file GameResultsScreen.browser.test.tsx
 * Proves the optional-section contract (cleanup-audit N3): tierInfo/stats/
 * onCollectXP are each independently omittable, and the extra
 * secondary/tertiary actions render only when supplied. Written as part of
 * adopting this component for SurvivalGameOverScreen, which needs none of
 * the tier/stat/XP sections but adds a "Change Mode" + "Back" pair.
 *
 * Mocks `useLeaderboard` — GameResultsScreen always renders a Leaderboard,
 * and this suite is about the results chrome, not live leaderboard data.
 */
import { NextIntlClientProvider } from "next-intl";

import { Trophy } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import messages from "@/messages/en.json";
import { GameResultsScreen } from "./GameResultsScreen";

import type { TierInfo } from "@/features/game/domain";

vi.mock("@/features/game/hooks", () => ({
    useLeaderboard: () => ({ entries: [], loading: false, error: null }),
    usePrefersReducedMotion: () => false,
}));

function withIntl(ui: React.ReactNode) {
    return (
        <NextIntlClientProvider locale="en" messages={messages}>
            {ui}
        </NextIntlClientProvider>
    );
}

const TIER_INFO: TierInfo = {
    id: "gold",
    emoji: "🥇",
    color: "#b8860b",
    bg: "#fff8e1",
    border: "#e6c200",
    nextThreshold: 500,
};

describe("GameResultsScreen — optional sections", () => {
    it("renders tier badge + stat grid + the paired Play Again/Collect XP row when all three are supplied (Match/Speed shape)", async () => {
        const screen = await render(
            withIntl(
                <GameResultsScreen
                    title="Perfect Match!"
                    icon={Trophy}
                    iconBg="bg-both"
                    iconBorder="#000"
                    score={420}
                    bestScore={100}
                    tierInfo={TIER_INFO}
                    stats={[{ value: 10, label: "Matched", color: "#000" }]}
                    gameMode="match"
                    accentColor="#ce82ff"
                    xpEarned={420}
                    onPlayAgain={() => {}}
                    onCollectXP={() => {}}
                />,
            ),
        );

        await expect.element(screen.getByText("Gold")).toBeInTheDocument();
        await expect.element(screen.getByText("Matched")).toBeInTheDocument();
        await expect.element(screen.getByText("Play Again")).toBeInTheDocument();
        await expect.element(screen.getByText("+420 XP")).toBeInTheDocument();
    });

    it("omits the tier badge, stat grid, and Collect XP button when they're not supplied, rendering Play Again full-width instead (Survival shape)", async () => {
        const screen = await render(
            withIntl(
                <GameResultsScreen
                    title="Game Over!"
                    icon={Trophy}
                    iconBg="bg-survival"
                    iconBorder="#000"
                    score={80}
                    bestScore={100}
                    gameMode="survival-infinity"
                    accentColor="#ff9600"
                    onPlayAgain={() => {}}
                    secondaryAction={{ label: "Change Mode", onClick: () => {} }}
                    tertiaryAction={{ label: "Back to Kana", onClick: () => {} }}
                />,
            ),
        );

        expect(screen.container.textContent).not.toContain("Gold");
        expect(screen.container.textContent).not.toContain("XP");
        await expect.element(screen.getByText("Play Again")).toBeInTheDocument();
        await expect.element(screen.getByText("Change Mode")).toBeInTheDocument();
        await expect.element(screen.getByText("Back to Kana")).toBeInTheDocument();
    });

    it("shows the new-best-score badge only when score beats bestScore", async () => {
        const beat = await render(
            withIntl(
                <GameResultsScreen
                    title="Game Over!"
                    icon={Trophy}
                    iconBg="bg-survival"
                    iconBorder="#000"
                    score={150}
                    bestScore={100}
                    gameMode="survival-infinity"
                    accentColor="#ff9600"
                    onPlayAgain={() => {}}
                />,
            ),
        );
        await expect.element(beat.getByText("🎉 New Best Score!")).toBeInTheDocument();

        const notBeat = await render(
            withIntl(
                <GameResultsScreen
                    title="Game Over!"
                    icon={Trophy}
                    iconBg="bg-survival"
                    iconBorder="#000"
                    score={50}
                    bestScore={100}
                    gameMode="survival-infinity"
                    accentColor="#ff9600"
                    onPlayAgain={() => {}}
                />,
            ),
        );
        expect(notBeat.container.textContent).not.toContain("New Best Score");
    });
});
