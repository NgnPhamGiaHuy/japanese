/**
 * Unified Game Engine for flashcard game modes.
 *
 * @remarks
 * This module provides a centralized, maintainable architecture for all game modes.
 * It replaces the fragmented hook-based approach with clean separation of concerns.
 *
 * ## Architecture Overview
 *
 * The engine follows a layered architecture:
 *
 * 1. **Core Layer** - Pure game logic (no React, no side effects)
 *    - GameEngine: Main orchestrator
 *    - GameStateMachine: Phase transitions
 *    - TimerController: Timing logic
 *    - ScoringEngine: Point calculation
 *    - ProgressionTracker: Stats tracking
 *
 * 2. **Strategy Layer** - Mode-specific rules
 *    - SpeedModeStrategy: Rapid-fire gameplay
 *    - [Future modes extend ModeStrategy interface]
 *
 * 3. **Question Layer** - Question generation
 *    - QuestionEngine: Orchestrates generation
 *    - QuestionTypeSelector: Chooses question format
 *    - DistractorBuilder: Creates wrong answers
 *
 * 4. **Memory Layer** - Adaptive learning
 *    - CardMemoryManager: Tracks performance
 *    - CardSelector: Intelligent card picking
 *
 * 5. **Integration Layer** - React hooks
 *    - useGameEngine: Bridges engine with React
 *    - useGameSession: Firestore sync (unchanged)
 *
 * ## Key Benefits
 *
 * - **Single Source of Truth**: One GameState object replaces 15+ useState calls
 * - **Testability**: Pure functions, easy to unit test
 * - **Reusability**: Same engine for all modes
 * - **Maintainability**: Clear separation of concerns
 * - **Extensibility**: New modes via strategy pattern
 * - **Performance**: Optimized state updates, efficient timers
 *
 * ## Usage Example
 *
 * ```typescript
 * import { useGameEngine, SpeedModeStrategy } from "@/features/game/engine";
 *
 * function SpeedMode({ cards, userId, displayName, addXP }) {
 *   const strategy = useMemo(() => new SpeedModeStrategy(), []);
 *
 *   const { state, startGame, submitAnswer, reset } = useGameEngine({
 *     cards,
 *     strategy,
 *     gameMode: "flashcard_speed",
 *     bestScore: 0,
 *     userId,
 *     displayName,
 *     addXP,
 *   });
 *
 *   if (!state) return <Loading />;
 *
 *   return (
 *     <div>
 *       {state.phase === "intro" && <IntroScreen onStart={startGame} />}
 *       {state.phase === "playing" && (
 *         <GameScreen
 *           question={state.currentQuestion}
 *           onAnswer={submitAnswer}
 *           score={state.score}
 *           streak={state.streak}
 *         />
 *       )}
 *       {state.phase === "results" && (
 *         <ResultsScreen score={state.score} onReset={reset} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * ## Creating New Game Modes
 *
 * 1. Implement ModeStrategy interface:
 * ```typescript
 * class CustomModeStrategy implements ModeStrategy {
 *   readonly name = "custom";
 *   readonly totalQuestions = 20;
 *
 *   getTimeLimit(level: number): number { ... }
 *   getDifficultyLevel(...): number { ... }
 *   calculatePoints(params: ScoringParams): number { ... }
 *   getQuestionConfig(level: number): QuestionGenerationConfig { ... }
 *   shouldAdvanceLevel(state: GameState): boolean { ... }
 *   getComboThreshold(): number { ... }
 * }
 * ```
 *
 * 2. Use with engine:
 * ```typescript
 * const strategy = new CustomModeStrategy();
 * const { state, startGame, submitAnswer } = useGameEngine({
 *   cards,
 *   strategy,
 *   // ...
 * });
 * ```
 *
 * No changes to core engine needed!
 *
 * ## Anti-Patterns Fixed
 *
 * 1. **Scattered State** → Single GameState object
 * 2. **Timer Duplication** → TimerController class
 * 3. **Question Coupling** → QuestionEngine
 * 4. **Side Effects in Logic** → Isolated in hooks
 * 5. **Implicit Transitions** → GameStateMachine
 * 6. **Scoring Duplication** → Strategy pattern
 * 7. **Ref Overuse** → Proper encapsulation
 *
 * ## Testing
 *
 * Each component is independently testable:
 * - Unit tests for strategies, scoring, timers
 * - Integration tests for engine
 * - Property-based tests for invariants
 * - E2E tests for user flows
 *
 * See __tests__/GameEngine.test.ts for examples.
 *
 * @packageDocumentation
 */

export * from "./types";
export * from "./core";
export * from "./questions";
export * from "./memory";
export * from "./strategies";
