/**
 * Flashcard Dashboard Page — Pure Orchestrator
 *
 * @remarks
 * Responsibilities (ONLY):
 * - Render FlashcardDashboard feature root
 *
 * NO business logic, NO state management, NO direct service calls.
 */

"use client";

import { FlashcardDashboard } from "@/features/flashcard/dashboard";

export default function FlashcardIndexPage() {
    return <FlashcardDashboard />;
}
