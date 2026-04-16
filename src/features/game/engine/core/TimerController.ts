/**
 * Centralized timer controller for game sessions.
 * Handles precise timing, tick callbacks, and timeout detection.
 */

import type { TimerState } from "../types";

const DEFAULT_TICK_MS = 80;

interface TimerControllerConfig {
    tickMs?: number;
    onTick: (state: TimerState) => void;
    onTimeout: () => void;
}

export class TimerController {
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private startTime: number = 0;
    private limitSeconds: number = 0;
    private readonly tickMs: number;
    private readonly onTick: (state: TimerState) => void;
    private readonly onTimeout: () => void;

    constructor(config: TimerControllerConfig) {
        this.tickMs = config.tickMs ?? DEFAULT_TICK_MS;
        this.onTick = config.onTick;
        this.onTimeout = config.onTimeout;
    }

    /**
     * Starts the timer with the specified time limit.
     * Automatically stops any existing timer first.
     */
    start(limitSeconds: number): void {
        this.stop();
        this.startTime = Date.now();
        this.limitSeconds = limitSeconds;

        this.intervalId = setInterval(() => {
            const elapsed = (Date.now() - this.startTime) / 1000;
            const remaining = Math.max(0, this.limitSeconds - elapsed);
            const fraction = remaining / this.limitSeconds;

            this.onTick({
                isRunning: true,
                elapsed,
                remaining,
                fraction,
            });

            if (elapsed >= this.limitSeconds) {
                this.stop();
                this.onTimeout();
            }
        }, this.tickMs);
    }

    /**
     * Stops the timer and clears the interval.
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Returns elapsed time in seconds since timer started.
     */
    getElapsed(): number {
        if (!this.intervalId) return 0;
        return (Date.now() - this.startTime) / 1000;
    }

    /**
     * Returns remaining time in seconds.
     */
    getRemaining(): number {
        return Math.max(0, this.limitSeconds - this.getElapsed());
    }

    /**
     * Checks if timer is currently running.
     */
    isRunning(): boolean {
        return this.intervalId !== null;
    }

    /**
     * Cleanup method to be called when controller is no longer needed.
     */
    destroy(): void {
        this.stop();
    }
}
