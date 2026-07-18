/**
 * PracticeHeader — Header with mode toggle and random toggle
 *
 * @remarks
 * Displays current character romaji (or ??? in recall mode) and control buttons.
 */

"use client";

import { useTranslations } from "next-intl";

import { Brain, Eye, PenTool, Shuffle } from "lucide-react";

import { ScreenHeader } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { getModeConfig } from "../utils/getModeConfig";

import type { LucideIcon } from "lucide-react";
import type { PracticeHeaderProps, PracticeMode } from "../types";

const MODE_ICONS: Record<PracticeMode, LucideIcon> = { trace: PenTool, copy: Eye, recall: Brain };

export function PracticeHeader({
    mode,
    char,
    isRandom,
    themeColor,
    onModeChange,
    onRandomToggle,
}: PracticeHeaderProps) {
    const t = useTranslations("KanaPractice");
    const tCommon = useTranslations("Common");
    const config = getModeConfig(mode, t);
    const ModeIcon = MODE_ICONS[mode];

    return (
        <ScreenHeader
            title={`${t("draw")} ${config.showRomaji ? char.romaji : t("unknown")}`}
            backHref="/kana"
            rightWrapperClassName="flex items-center justify-end gap-1 md:gap-2 shrink-0 min-w-0"
            right={
                <>
                    <Button
                        variant="plain"
                        size="auto"
                        onClick={onModeChange}
                        className="flex shrink-0 items-center gap-1 rounded-lg border-2 border-gray-200 bg-white px-2 py-1.5 text-xs font-bold text-gray-500 shadow-none transition-all hover:bg-gray-50 hover:shadow-none active:translate-y-0 md:rounded-xl md:px-3 md:py-2 md:text-xs"
                        icon={ModeIcon}
                        iconSize={14}
                    >
                        <span className="hidden sm:inline">
                            {t("mode", { label: config.label })}
                        </span>
                    </Button>
                    <Button
                        variant="plain"
                        size="auto"
                        onClick={onRandomToggle}
                        className={`flex shrink-0 items-center gap-1 rounded-lg border-2 px-2 py-1.5 text-xs font-bold shadow-none transition-all hover:shadow-none active:translate-y-0 md:rounded-xl md:px-3 md:py-2 md:text-xs ${
                            isRandom
                                ? `${themeColor.primaryLightBg} ${themeColor.text} ${themeColor.primaryBorder} shadow-sm`
                                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                        icon={Shuffle}
                        iconSize={14}
                    >
                        <span className="hidden sm:inline">
                            {isRandom ? tCommon("random") : tCommon("sequential")}
                        </span>
                    </Button>
                </>
            }
        />
    );
}
