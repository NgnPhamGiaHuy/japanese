/**
 * Tracks player progression and answer history.
 * Used for adaptive difficulty and analytics.
 */

import type { AnswerEvent } from "../types";

export class ProgressionTracker {
    private history: AnswerEvent[] = [];

    /**
     * Records an answer event for tracking.
     */
    recordAnswer(event: AnswerEvent): void {
        this.history.push(event);
    }

    /**
     * Returns the complete answer history.
     */
    getHistory(): readonly AnswerEvent[] {
        return [...this.history];
    }

    /**
     * Resets all tracking data.
     */
    reset(): void {
        this.history = [];
    }
}
