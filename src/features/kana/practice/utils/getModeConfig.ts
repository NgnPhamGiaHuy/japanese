/**
 * getModeConfig — Returns configuration for practice mode
 *
 * @remarks
 * Centralizes mode-specific labels, instructions, and display settings.
 */

import type { useTranslations } from "next-intl";
import type { PracticeMode, PracticeModeConfig } from "../types";

export function getModeConfig(
    mode: PracticeMode,
    t: ReturnType<typeof useTranslations<"KanaPractice">>,
): PracticeModeConfig {
    const configs: Record<PracticeMode, PracticeModeConfig> = {
        trace: {
            mode: "trace",
            label: t("modes.trace"),
            instruction: t("instructions.trace"),
            showReference: true,
            showRomaji: true,
        },
        copy: {
            mode: "copy",
            label: t("modes.copy"),
            instruction: t("instructions.copy"),
            showReference: true,
            showRomaji: true,
        },
        recall: {
            mode: "recall",
            label: t("modes.recall"),
            instruction: t("instructions.recall"),
            showReference: false,
            showRomaji: false,
        },
    };

    return configs[mode];
}
