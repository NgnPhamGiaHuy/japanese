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
        1: {
            mode: 1,
            label: t("modes.trace"),
            instruction: t("instructions.trace"),
            showReference: true,
            showRomaji: true,
        },
        2: {
            mode: 2,
            label: t("modes.copy"),
            instruction: t("instructions.copy"),
            showReference: true,
            showRomaji: true,
        },
        3: {
            mode: 3,
            label: t("modes.recall"),
            instruction: t("instructions.recall"),
            showReference: false,
            showRomaji: false,
        },
    };

    return configs[mode];
}
