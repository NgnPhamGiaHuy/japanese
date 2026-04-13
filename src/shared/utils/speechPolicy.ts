export type AudioStage = "prompt" | "feedback";
export type ImmersiveQuestionType = "read" | "reverse" | "listen" | "type" | "speed" | "match";

/**
 * Centralized audio gating policy for all game modes.
 *
 * Rules:
 *  - prompt   stage: NEVER auto-play audio when a question appears unless it's a listening quiz. Playing audio
 *                    on the prompt reveals the answer before the user has interacted.
 *  - feedback stage: ALL question types play audio after submission so the learner
 *                    always hears correct pronunciation as reinforcement.
 */
export function allowAudio(
    type: ImmersiveQuestionType | string | undefined,
    stage: AudioStage,
): boolean {
    if (stage === "prompt") return false;
    if (stage === "feedback") return true;
    return false;
}

/** Convenience alias — kept for any call sites that only care about the prompt. */
export function shouldSpeakQuestionPrompt(
    type: ImmersiveQuestionType | string | undefined,
): boolean {
    return allowAudio(type, "prompt");
}
