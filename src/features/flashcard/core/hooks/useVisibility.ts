import { useMemo } from "react";

import { getVisibilityConfig, VisibilityLevel } from "../utils/visibility";

import type { Lesson } from "../types/flashcard.types";
import type { VisibilityConfig } from "../utils/visibility";

/**
 * Hook to resolve and memoize the visibility configuration for a lesson.
 *
 * Provides a clean interface for components to access icon, label, and
 * semantic state without re-implementing switch logic.
 */
export function useVisibility(lesson: Lesson): VisibilityConfig {
    return useMemo(
        () => getVisibilityConfig(lesson),
        [lesson.isPublic, lesson.allowLinkAccess, lesson.collaborators, lesson.roles],
    );
}

export { VisibilityLevel };
export type { VisibilityConfig };
