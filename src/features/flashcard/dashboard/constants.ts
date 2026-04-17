import type { DashboardTab } from "./types";

/**
 * Deterministic tab configuration for the Flashcard Dashboard.
 * Higher priority (lower number) appears first.
 */
export const DASHBOARD_TABS: (DashboardTab & { priority: number })[] = [
    { id: "discover", label: "Discover", priority: 1 },
    { id: "personal", label: "My Decks", priority: 2 },
    { id: "shared", label: "Shared", priority: 3 },
];

export const DEFAULT_TAB_ID = "discover";
