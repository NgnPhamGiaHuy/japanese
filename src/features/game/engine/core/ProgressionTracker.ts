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
     * Returns the most recent N answers.
     */
    getRecentHistory(count: number): readonly AnswerEvent[] {
        return this.history.slice(-count);
    }

    /**
     * Calculates accuracy over the last N answers.
     */
    getRecentAccuracy(count: number): number {
        const recent = this.getRecentHistory(count);
        if (recent.length === 0) return 0;

        const correct = recent.filter((e) => e.correct).length;
        return correct / recent.length;
    }

    /**
     * Calculates average response time over the last N answers.
     */
    getAverageResponseTime(count: number): number {
        const recent = this.getRecentHistory(count);
        if (recent.length === 0) return 0;

        const total = recent.reduce((sum, e) => sum + e.responseMs, 0);
        return total / recent.length;
    }

    /**
     * Resets all tracking data.
     */
    reset(): void {
        this.history = [];
    }

    /**
     * Returns total number of recorded answers.
     */
    getTotalAnswers(): number {
        return this.history.length;
    }

    /**
     * Returns total number of correct answers.
     */
    getTotalCorrect(): number {
        return this.history.filter((e) => e.correct).length;
    }

    /**
     * Returns overall accuracy percentage.
     */
    getOverallAccuracy(): number {
        if (this.history.length === 0) return 0;
        return this.getTotalCorrect() / this.history.length;
    }
}
