import type { QuestionType } from "../types/kana.types";

/**
 * Two stages where audio could potentially fire:
 * - "prompt"   : when the question is first shown
 * - "feedback" : after the user has submitted an answer
 */
export type AudioStage = "prompt" | "feedback";

/**
 * Centralized audio gating policy for all game modes.
 *
 * Rules:
 *  - prompt   stage: NEVER auto-play audio when a question appears. Playing audio
 *                    on the prompt reveals the answer before the user has interacted,
 *                    eliminating the cognitive challenge.
 *  - feedback stage: ALL question types play audio after submission so the learner
 *                    always hears correct pronunciation as reinforcement, regardless
 *                    of whether they answered correctly or not.
 */
export function allowAudio(type: QuestionType, stage: AudioStage): boolean {
    if (stage === "prompt") return false;
    if (stage === "feedback") return true;
    return false;
}

/** Convenience alias — kept for any call sites that only care about the prompt. */
export function shouldSpeakQuestionPrompt(type: QuestionType): boolean {
    return allowAudio(type, "prompt");
}
