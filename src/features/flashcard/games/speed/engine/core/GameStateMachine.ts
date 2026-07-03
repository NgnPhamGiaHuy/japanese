/**
 * State machine for managing game phase transitions.
 * Ensures valid state transitions and prevents invalid game states.
 */

import type { GamePhase, PhaseTransition } from "../types";

export class GameStateMachine {
    private phase: GamePhase = "intro";
    private listeners: Array<(phase: GamePhase) => void> = [];

    getPhase(): GamePhase {
        return this.phase;
    }

    /**
     * Checks if a transition is valid from the current phase.
     */
    canTransition(transition: PhaseTransition): boolean {
        switch (transition) {
            case "START_GAME":
                return this.phase === "intro";
            case "ANSWER_SUBMITTED":
                return this.phase === "playing";
            case "FEEDBACK_COMPLETE":
                return this.phase === "feedback";
            case "GAME_COMPLETE":
                return this.phase === "playing" || this.phase === "feedback";
            case "TIMEOUT":
                return this.phase === "playing";
            case "RESET":
                return true;
            default:
                return false;
        }
    }

    /**
     * Attempts to transition to a new phase.
     * Returns true if successful, false if invalid.
     */
    transition(transition: PhaseTransition): boolean {
        if (!this.canTransition(transition)) {
            console.warn(`[GameStateMachine] Invalid transition: ${transition} from ${this.phase}`);
            return false;
        }

        const nextPhase = this.getNextPhase(transition);
        if (nextPhase === this.phase) return false;

        this.phase = nextPhase;
        this.notifyListeners();
        return true;
    }

    private getNextPhase(transition: PhaseTransition): GamePhase {
        switch (transition) {
            case "START_GAME":
                return "playing";
            case "ANSWER_SUBMITTED":
            case "TIMEOUT":
                return "feedback";
            case "FEEDBACK_COMPLETE":
                return "playing";
            case "GAME_COMPLETE":
                return "results";
            case "RESET":
                return "intro";
            default:
                return this.phase;
        }
    }

    /**
     * Subscribe to phase changes.
     * Returns unsubscribe function.
     */
    subscribe(listener: (phase: GamePhase) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }

    private notifyListeners(): void {
        this.listeners.forEach((listener) => listener(this.phase));
    }
}
