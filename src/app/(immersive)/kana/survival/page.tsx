"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useKanaDataset, useSurvivalGame } from "@/features/kana/hooks";
import { useBestScores } from "@/features/user/hooks";
import { useAppStore } from "@/lib/app-store";
import SurvivalDropScreen from "./_components/SurvivalDropScreen";
import SurvivalGameOverScreen from "./_components/SurvivalGameOverScreen";
import SurvivalQuizScreen from "./_components/SurvivalQuizScreen";
import SurvivalSetupScreen from "./_components/SurvivalSetupScreen";

const KanaSurvivalPage = () => {
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
};

export default KanaSurvivalPage;
