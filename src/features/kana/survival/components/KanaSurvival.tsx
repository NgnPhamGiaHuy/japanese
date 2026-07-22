/**
 * KanaSurvival — Main survival component
 *
 * @remarks
 * Root component for the kana survival feature. Wires the dataset, auth,
 * best-scores and router, then routes to one of the four phase screens.
 */

"use client";

import { useEffect, useRef } from "react";

import { useKanaDataset } from "@/features/kana/hooks";
import { useBestScores } from "@/features/user";
import { useRouter } from "@/i18n/navigation";
import { useAppStore } from "@/lib/app-store";
import SurvivalDropScreen from "./SurvivalDropScreen";
import SurvivalGameOverScreen from "./SurvivalGameOverScreen";
import SurvivalQuizScreen from "./SurvivalQuizScreen";
import SurvivalSetupScreen from "./SurvivalSetupScreen";
import { useSurvivalGame } from "../hooks";

export function KanaSurvival() {
    const { dataset, alphabet } = useKanaDataset();
    const { user } = useAppStore();
    const { bestScores, saveScore } = useBestScores();
    const router = useRouter();

    const game = useSurvivalGame({
        dataset,
        alphabet,
        userId: user?.uid ?? null,
        userName: user?.displayName ?? "",
        onSaveScore: saveScore,
    });

    const inputRef = useRef<HTMLDivElement>(null);

    // Pre-fill leaderboard name from Google profile on first load
    useEffect(() => {
        if (user?.displayName && !game.localName) {
            game.setLocalName(user.displayName.substring(0, 10));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.displayName]);

    useEffect(() => {
        if (game.phase === "playing" && game.challengeMode === "drop") inputRef.current?.focus();
    }, [game.phase, game.challengeMode]);

    if (game.phase === "setup") {
        return (
            <SurvivalSetupScreen
                game={game}
                bestScores={bestScores}
                alphabet={alphabet}
                userId={user?.uid}
            />
        );
    }

    if (game.phase === "gameover") {
        return (
            <SurvivalGameOverScreen
                game={game}
                bestScores={bestScores}
                userId={user?.uid}
                onBack={() => router.back()}
            />
        );
    }

    if (game.challengeMode !== "drop") {
        return <SurvivalQuizScreen game={game} userId={user?.uid} />;
    }

    return <SurvivalDropScreen game={game} userId={user?.uid} inputRef={inputRef} />;
}
