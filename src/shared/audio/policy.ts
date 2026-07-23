/**
 * Speech gating policy.
 *
 * @remarks
 * The previous `allowAudio(type, stage)` ignored its `type` argument entirely and returned `true`
 * at all four of its call sites, so every guard that read as policy enforcement was a tautology.
 * Its doc comment described a listening-quiz exception that had no implementation.
 *
 * This is the rule the old comment promised, now actually enforced:
 *
 * - **prompt** stage: playing the audio *is* the answer for a reading question, so it must not
 *   auto-play — unless the question type is a listening exercise, where the audio is the prompt.
 * - **feedback** stage: always allowed. The learner has already answered, and hearing the correct
 *   pronunciation is the reinforcement.
 *
 * User-initiated playback (a tap on a speaker button) is never gated here — the learner asking to
 * hear something cannot leak an answer to themselves by surprise.
 */

import type { AudioStage, SpeakTrigger } from "./types";

/** Question types whose prompt *is* the audio. */
const LISTENING_QUESTION_TYPES = new Set(["listen"]);

interface SpeechPolicyInput {
    stage: AudioStage;
    trigger: SpeakTrigger;
    questionType?: string;
}

export function allowSpeech({ stage, trigger, questionType }: SpeechPolicyInput): boolean {
    if (trigger === "user") return true;
    if (stage === "feedback") return true;
    if (stage === "prompt") return questionType !== undefined && isListeningType(questionType);
    return false;
}

export function isListeningType(questionType: string): boolean {
    return LISTENING_QUESTION_TYPES.has(questionType);
}
