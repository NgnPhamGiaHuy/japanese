import type { LucideIcon } from "lucide-react";
import { Globe2, Lock, Users } from "lucide-react";
import type { Lesson } from "../types";

/**
 * Categorical visibility levels for a lesson/deck.
 */
export enum VisibilityLevel {
    /** Visible only to the owner */
    PRIVATE = "PRIVATE",
    /** Shared via direct link or with specific collaborators */
    SHARED = "SHARED",
    /** Fully discoverable by anyone in the community */
    PUBLIC = "PUBLIC",
}

export interface VisibilityConfig {
    level: VisibilityLevel;
    icon: LucideIcon;
    label: string;
    description: string;
    variant: "default" | "success" | "warning";
}

export const VISIBILITY_MAPPINGS: Record<VisibilityLevel, VisibilityConfig> = {
    [VisibilityLevel.PRIVATE]: {
        level: VisibilityLevel.PRIVATE,
        icon: Lock,
        label: "Private",
        description: "Only you can see this deck",
        variant: "default",
    },
    [VisibilityLevel.SHARED]: {
        level: VisibilityLevel.SHARED,
        icon: Users,
        label: "Shared",
        description: "Visible to people with the link or specific access",
        variant: "warning",
    },
    [VisibilityLevel.PUBLIC]: {
        level: VisibilityLevel.PUBLIC,
        icon: Globe2,
        label: "Public",
        description: "Visible to everyone — no link required",
        variant: "success",
    },
};

/**
 * Single source of truth for resolving a lesson's visibility status.
 *
 * Logic hierarchy:
 * 1. isPublic === true -> PUBLIC (discoverable)
 * 2. allowLinkAccess === true OR collaborators.length > 0 -> SHARED (limited)
 * 3. Otherwise -> PRIVATE
 */
export function getVisibilityLevel(lesson: Lesson): VisibilityLevel {
    if (lesson.isPublic) {
        return VisibilityLevel.PUBLIC;
    }

    const hasCollaborators =
        (lesson.collaborators && lesson.collaborators.length > 0) ||
        (lesson.roles && Object.keys(lesson.roles).length > 1);

    if (lesson.allowLinkAccess || hasCollaborators) {
        return VisibilityLevel.SHARED;
    }

    return VisibilityLevel.PRIVATE;
}

/**
 * Returns the full configuration object for a given lesson's visibility.
 */
export function getVisibilityConfig(lesson: Lesson): VisibilityConfig {
    const level = getVisibilityLevel(lesson);
    return VISIBILITY_MAPPINGS[level];
}
