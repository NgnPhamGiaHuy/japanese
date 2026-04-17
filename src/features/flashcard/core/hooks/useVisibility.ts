import { useMemo } from "react";

import { getVisibilityConfig, VisibilityLevel } from "../utils";

import type { Lesson } from "../types";
import type { VisibilityConfig } from "../utils";

/**
 * Hook to resolve and memoize the visibility configuration for a lesson.
 *
 * Provides a clean interface for components to access icon, label, and
 * semantic state without re-implementing switch logic.
 */
export function useVisibility(lesson: Lesson): VisibilityConfig {
    return useMemo(() => getVisibilityConfig(lesson), [lesson]);
}

export { VisibilityLevel };
export type { VisibilityConfig };
