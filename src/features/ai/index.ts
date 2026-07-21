/**
 * AI Feature — Public API
 *
 * @remarks
 * The only surface other features and the app layer may import from.
 * Gemini access is brokered by Firebase AI Logic, so nothing here takes or
 * exposes an API key; `services/gemini.service` stays internal apart from the
 * one distractor helper the match game needs.
 */

// Generation hooks — one per surface, each a thin binding over useAIGeneration.
export { default as useAICard } from "./hooks/useAICard";
export { default as useAIDeck } from "./hooks/useAIDeck";
export { default as useAIExplanation } from "./hooks/useAIExplanation";
export { useAIImageDeck } from "./hooks/useAIImageDeck";

// Consumed by the match game to build plausible wrong answers.
export { generateMatchDistractors } from "./services/gemini.service";

export type { AIGenerateMode, JLPTLevel } from "./types";
