/**
 * Main game engine orchestrator.
 *
 * @remarks
 * Coordinates all game subsystems (state machine, timer, scoring, questions) to provide
 * a unified game loop. Maintains immutable state snapshots and delegates mode-specific
 * logic to strategy implementations.
 *
 * Key responsibilities:
 * - Lifecycle management (start, play, end)
 * - State transitions via state machine
 * - Timer coordination
 * - Answer evaluation and scoring
 * - Question progression
 * - Session persistence callbacks
 */

import { GameStateMachine } from "./GameStateMachine";
import { ProgressionTracker } from "./ProgressionTracker";
import { ScoringEngine } from "./ScoringEngine";
import { TimerController } from "./TimerController";
import { QuestionEngine } from "../questions";

import type { AnswerResult, GameEngineConfig, GameState, ModeStrategy, TimerState } from "../types";

export class GameEngine {
    private state: GameState;
    private readonly stateMachine: GameStateMachine;
    private readonly timer: TimerController;
    private readonly scoring: ScoringEngine;
    private readonly progression: ProgressionTracker;
    private readonly questionEngine: QuestionEngine;
    private readonly strategy: ModeStrategy;
    private readonly config: GameEngineConfig;

    constructor(config: GameEngineConfig) {
        this.config = config;
        this.strategy = config.strategy;
        this.stateMachine = new GameStateMachine();
        this.scoring = new ScoringEngine(this.strategy);
        this.progression = new ProgressionTracker();
        this.questionEngine = new QuestionEngine({
            cards: config.cards,
            strategy: this.strategy,
        });

        this.timer = new TimerController({
            onTick: (timerState) => this.handleTimerTick(timerState),
            onTimeout: () => this.handleTimeout(),
        });

        this.state = this.createInitialState();
    }

    /**
     * Starts a new game session.
     *
     * @remarks
     * Resets all state, initializes first question, and starts timer.
     * Transitions from intro → playing phase.
     */
    startGame(): void {
        if (!this.stateMachine.transition("START_GAME")) return;

        this.state = this.createInitialState();
        this.state.phase = "playing";
        this.progression.reset();
        this.questionEngine.reset();

        this.loadNextQuestion();
    }

    /**
     * Submits user's answer for evaluation.
     *
     * @remarks
     * Stops timer, evaluates correctness, updates score/streak, records outcome
     * for adaptive learning, and transitions to feedback phase. Auto-advances
     * after 1.1s feedback delay.
     */
    submitAnswer(answer: string): void {
        if (!this.stateMachine.transition("ANSWER_SUBMITTED")) return;
        if (!this.state.currentQuestion) return;

        this.timer.stop();
        this.state.selectedAnswer = answer;

        const result = this.evaluateAnswer(answer);
        this.applyAnswerResult(result);

        this.state.phase = "feedback";
        this.state.feedbackStatus = result.correct ? "correct" : "wrong";

        this.config.onSFXPlay?.(result.correct ? "correct" : "wrong");

        setTimeout(() => this.completeFeedback(), 1100);
    }

    /**
     * Resets engine to initial state.
     *
     * @remarks
     * Stops timer and returns to intro phase. Used for "play again" functionality.
     */
    reset(): void {
        this.stateMachine.transition("RESET");
        this.timer.stop();
        this.state = this.createInitialState();
    }

    /**
     * Returns immutable snapshot of current game state.
     *
     * @remarks
     * State is copied to prevent external mutations. React components should
     * treat this as read-only.
     */
    getState(): Readonly<GameState> {
        return { ...this.state };
    }

    /**
     * Cleanup method for React unmount.
     *
     * @remarks
     * Stops timer to prevent memory leaks. Must be called in useEffect cleanup.
     */
    destroy(): void {
        this.timer.destroy();
    }

    private createInitialState(): GameState {
        return {
            phase: "intro",
            feedbackStatus: "idle",
            questionIndex: 0,
            totalQuestions: this.strategy.totalQuestions,
            score: 0,
            streak: 0,
            maxStreak: 0,
            correctCount: 0,
            wrongCount: 0,
            timeRemaining: 0,
            timeLimit: 0,
            timerFraction: 1,
            currentQuestion: null,
            selectedAnswer: null,
            adaptiveLevel: 1,
        };
    }

    /**
     * Completes feedback phase and advances to next question or results.
     *
     * @remarks
     * Called automatically after feedback delay. Checks if game is complete,
     * otherwise loads next question and continues playing.
     */
    private completeFeedback(): void {
        if (this.state.questionIndex >= this.strategy.totalQuestions - 1) {
            this.endGame();
            return;
        }

        if (!this.stateMachine.transition("FEEDBACK_COMPLETE")) return;

        this.state.feedbackStatus = "idle";
        this.state.selectedAnswer = null;
        this.state.questionIndex++;
        this.state.phase = "playing";

        this.loadNextQuestion();
    }

    /**
     * Handles timer expiration (timeout).
     *
     * @remarks
     * Treats timeout as wrong answer: resets streak, increments wrong count,
     * records outcome for adaptive learning. Transitions to feedback phase.
     */
    private handleTimeout(): void {
        if (!this.stateMachine.transition("TIMEOUT")) return;

        this.state.feedbackStatus = "timeout";
        this.state.streak = 0;
        this.state.wrongCount++;

        if (this.state.currentQuestion) {
            this.questionEngine.recordAnswer({
                cardId: this.state.currentQuestion.cardId,
                questionIndex: this.state.questionIndex,
                correct: false,
                responseMs: this.state.timeLimit * 1000,
            });

            this.progression.recordAnswer({
                cardId: this.state.currentQuestion.cardId,
                correct: false,
                responseMs: this.state.timeLimit * 1000,
            });
        }

        this.config.onSFXPlay?.("wrong");

        setTimeout(() => this.completeFeedback(), 1100);
    }

    /**
     * Ends the game session and transitions to results.
     *
     * @remarks
     * Stops timer, transitions to results phase, and triggers session end callback
     * for persistence (Firestore sync, XP award, leaderboard update).
     */
    private endGame(): void {
        if (!this.stateMachine.transition("GAME_COMPLETE")) return;

        this.timer.stop();
        this.state.phase = "results";
        void this.config.onSessionEnd(this.state.score);
    }

    /**
     * Loads next question based on adaptive difficulty.
     *
     * @remarks
     * Queries strategy for current difficulty level, generates question via
     * QuestionEngine, and starts timer with appropriate time limit.
     */
    private loadNextQuestion(): void {
        const level = this.strategy.getDifficultyLevel(
            this.state.questionIndex,
            this.state.streak,
            this.progression.getHistory(),
        );

        this.state.adaptiveLevel = level;
        this.state.currentQuestion = this.questionEngine.generateQuestion(level);
        this.state.timeLimit = this.state.currentQuestion.metadata.timeLimit;

        this.timer.start(this.state.timeLimit);
    }

    /**
     * Evaluates answer correctness and calculates points.
     *
     * @remarks
     * Compares selected answer to correct answer, calculates points via strategy,
     * records outcome in both progression tracker and question engine memory.
     */
    private evaluateAnswer(answer: string): AnswerResult {
        const question = this.state.currentQuestion!;
        const correct = answer === question.answer;
        const responseTimeMs = this.timer.getElapsed() * 1000;

        const scoringResult = this.scoring.calculate({
            correct,
            timeRemaining: this.timer.getRemaining(),
            timeLimit: this.state.timeLimit,
            streak: correct ? this.state.streak + 1 : 0,
            questionIndex: this.state.questionIndex,
        });

        this.progression.recordAnswer({
            cardId: question.cardId,
            correct,
            responseMs: responseTimeMs,
        });

        this.questionEngine.recordAnswer({
            cardId: question.cardId,
            questionIndex: this.state.questionIndex,
            correct,
            responseMs: responseTimeMs,
            mistakenChoice: correct ? null : answer,
        });

        return {
            correct,
            points: correct ? scoringResult.points : 0,
            responseTimeMs,
            newStreak: correct ? this.state.streak + 1 : 0,
            comboMultiplier: scoringResult.multiplier,
        };
    }

    /**
     * Applies answer result to game state.
     *
     * @remarks
     * Updates score, streak, and counters. Triggers score sync callback for
     * real-time Firestore updates.
     */
    private applyAnswerResult(result: AnswerResult): void {
        if (result.correct) {
            this.state.score += result.points;
            this.state.streak = result.newStreak;
            this.state.maxStreak = Math.max(this.state.maxStreak, result.newStreak);
            this.state.correctCount++;
            this.config.onScoreSync(this.state.score);
        } else {
            this.state.streak = 0;
            this.state.wrongCount++;
        }
    }

    /**
     * Handles timer tick updates.
     *
     * @remarks
     * Called every 80ms by TimerController. Updates time remaining and fraction
     * for UI progress bar rendering.
     */
    private handleTimerTick(timerState: TimerState): void {
        this.state.timeRemaining = timerState.remaining;
        this.state.timerFraction = timerState.fraction;
    }
}
