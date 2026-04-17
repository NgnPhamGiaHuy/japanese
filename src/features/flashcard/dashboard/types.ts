/**
 * Type definitions for Flashcard Dashboard feature
 */

import type { Lesson } from "@/features/flashcard/core/types";
import type { GameStatEntry } from "@/features/game";

export interface DashboardTab {
    id: "personal" | "shared" | "discover";
    label: string;
    badge?: number;
}

export interface DeckCardProps {
    lesson: Lesson;
    isShared?: boolean;
    matchStats?: GameStatEntry;
    speedStats?: GameStatEntry;
    onDelete?: () => void;
    onShare?: () => void;
}

export interface SortableDeckCardProps extends DeckCardProps {
    canReorder?: boolean;
    onDragStart: () => void;
    onDragEnd: () => void;
}
