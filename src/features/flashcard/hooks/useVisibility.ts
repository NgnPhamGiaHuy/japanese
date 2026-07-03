import { useMemo } from "react";

import { getVisibilityConfig, resolveVisibilityColor, VisibilityLevel } from "../utils";

import type { Lesson } from "../types";
import type { VisibilityConfig } from "../utils";

/**
 * Hook to resolve and memoize the visibility configuration for a lesson.
 *
 * Provides a clean interface for components to access icon, label, and
 * semantic state without re-implementing switch logic.
 */
export function useVisibility(lesson: Lesson): VisibilityConfig & { effectiveColor: string } {
    return useMemo(() => {
        const config = getVisibilityConfig(lesson);
        const themeColor = lesson.themeColor || "#1cb0f6";

        return {
            ...config,
            effectiveColor: resolveVisibilityColor(config, themeColor),
        };
    }, [lesson]);
}

export { VisibilityLevel };
export type { VisibilityConfig };
