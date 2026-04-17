/**
 * getModeConfig — Returns configuration for practice mode
 *
 * @remarks
 * Centralizes mode-specific labels, instructions, and display settings.
 */

import type { PracticeMode, PracticeModeConfig } from "../types";

export function getModeConfig(mode: PracticeMode): PracticeModeConfig {
    const configs: Record<PracticeMode, PracticeModeConfig> = {
        1: {
            mode: 1,
            label: "Trace",
            instruction: "Step 1: Trace the character",
            showReference: true,
            showRomaji: true,
        },
        2: {
            mode: 2,
            label: "Copy",
            instruction: "Step 2: Draw with reference",
            showReference: true,
            showRomaji: true,
        },
        3: {
            mode: 3,
            label: "Recall",
            instruction: "Step 3: Draw from memory",
            showReference: false,
            showRomaji: false,
        },
    };

    return configs[mode];
}
