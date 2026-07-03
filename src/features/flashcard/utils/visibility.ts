import { Globe2, Lock, Sparkles } from "lucide-react";

import type { LucideIcon } from "lucide-react";
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
    color?: string;
}

export const VISIBILITY_MAPPINGS: Record<VisibilityLevel, VisibilityConfig> = {
    [VisibilityLevel.PRIVATE]: {
        level: VisibilityLevel.PRIVATE,
        icon: Lock,
        label: "Restricted",
        description: "Only invited people can open",
        variant: "default",
        color: "#afafaf",
    },
    [VisibilityLevel.SHARED]: {
        level: VisibilityLevel.SHARED,
        icon: Globe2,
        label: "Anyone with the link",
        description: "Anyone with the link can view",
        variant: "warning",
        color: "#1cb0f6", // Will be overridden by themeHex in many places, but this is the default
    },
    [VisibilityLevel.PUBLIC]: {
        level: VisibilityLevel.PUBLIC,
        icon: Sparkles,
        label: "Public",
        description: "Visible to everyone — no link required",
        variant: "success",
        color: "#ffc800", // Vibrant Gold for 'Featured/Community' discovery
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

    if (lesson.allowLinkAccess) {
        return VisibilityLevel.SHARED;
    }

    return VisibilityLevel.PRIVATE;
}

/**
 * Resolves the final display color for a visibility config,
 * applying theme overrides (e.g., Shared uses the deck color).
 */
export function resolveVisibilityColor(config: VisibilityConfig, themeColor?: string): string {
    if (config.level === VisibilityLevel.SHARED && themeColor) {
        return themeColor;
    }
    return config.color || "#afafaf";
}

/**
 * Returns the full configuration object for a given lesson's visibility.
 */
export function getVisibilityConfig(lesson: Lesson): VisibilityConfig {
    const level = getVisibilityLevel(lesson);
    return VISIBILITY_MAPPINGS[level];
}
