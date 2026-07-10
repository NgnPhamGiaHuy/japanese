/**
 * The public audio API.
 *
 * @remarks
 * Everything below is consumed from outside `shared/audio`. Internal collaborators import each
 * other directly, and test seams (`resetAudioManager`, `resetAudioTelemetry`, `abortAllSequences`)
 * are imported from their own modules — they are not part of this surface.
 */

export { suspendAudioContext } from "./channels";
export { configureAudio, playSfx, speak, stopAllAudio } from "./manager";
export { sequence } from "./sequencer";
export { subscribeAudioEvents } from "./telemetry";
export { useAudioStatus } from "./useAudioStatus";

export type { AudioStatus } from "./status";
export type { AudioEvent } from "./telemetry";
export type { AudioSettings, PlaybackHandle, SfxCue, SpeakOptions } from "./types";
