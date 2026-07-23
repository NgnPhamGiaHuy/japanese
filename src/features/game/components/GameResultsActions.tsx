"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/shared/components/ui";

export interface GameResultsScreenAction {
    label: string;
    onClick: () => void;
}

interface GameResultsActionsProps {
    onPlayAgain: () => void;
    primaryColor: "purple" | "orange" | "blue" | "green" | "red";
    xpEarned: number;
    /** Omit for modes with no explicit XP-collection step — Play Again renders full-width instead */
    onCollectXP?: () => void;
    /** Extra outline-style action rendered below the primary row (e.g. "Change Mode") */
    secondaryAction?: GameResultsScreenAction;
    /** Extra ghost-style action rendered below secondaryAction (e.g. "Back") */
    tertiaryAction?: GameResultsScreenAction;
}

/** GameResultsScreen's action-button row — split out to keep that file under the line cap. */
export function GameResultsActions({
    onPlayAgain,
    primaryColor,
    xpEarned,
    onCollectXP,
    secondaryAction,
    tertiaryAction,
}: GameResultsActionsProps) {
    const t = useTranslations("Game");

    return (
        <div className="mb-8 w-full space-y-3">
            {onCollectXP ? (
                <div className="flex w-full gap-3">
                    <Button
                        variant="secondary"
                        color={primaryColor}
                        onClick={onPlayAgain}
                        className="flex-1 py-4"
                    >
                        {t("playAgain")}
                    </Button>
                    <Button
                        variant="primary"
                        color={primaryColor}
                        onClick={onCollectXP}
                        className="flex-1 py-4"
                    >
                        {t("xpEarned", { xp: xpEarned })}
                    </Button>
                </div>
            ) : (
                <Button
                    variant="primary"
                    color={primaryColor}
                    onClick={onPlayAgain}
                    className="w-full py-4"
                >
                    {t("playAgain")}
                </Button>
            )}
            {secondaryAction && (
                <Button variant="outline" onClick={secondaryAction.onClick} className="w-full py-4">
                    {secondaryAction.label}
                </Button>
            )}
            {tertiaryAction && (
                <Button variant="ghost" onClick={tertiaryAction.onClick} className="w-full py-4">
                    {tertiaryAction.label}
                </Button>
            )}
        </div>
    );
}
