"use client";

/**
 * The single owner of all audio behaviour.
 *
 * @remarks
 * Everything that used to be scattered lives here: which channel a sound plays on, whether the
 * user's settings permit it, whether the speech policy permits it, and what happened afterwards.
 *
 * The two behaviours this centralisation fixes:
 *
 * 1. **`autoPlay` is now enforced once, for every mode.** It used to be read at four call sites
 *    and ignored at six others, so turning off "Auto-Play Audio" silenced flashcards but not
 *    Speed, Match, Quiz, Survival, or Kana Practice.
 * 2. **Failures are observable.** `speak()` returns a handle whose promise resolves with what
 *    actually happened, instead of a `void` that swallowed every error.
 *
 * Settings are read at call time rather than subscribed to, so a toggle takes effect on the next
 * sound with no resubscription and no stale closure.
 */
import { getContext, getSfxInput, scheduleWhenRunning, setSfxGain } from "./channels";
import { allowSpeech } from "./policy";
import { scheduleCue, SFX_THROTTLE_MS } from "./sfx.presets";
import { emitAudioEvent } from "./telemetry";
import { DEFAULT_AUDIO_SETTINGS } from "./types";
import { speakNow, stopVoice } from "./voice/googleTranslateTts";

// Side-effect import: installs the single gesture-unlock listener set.
import "./unlock";

import type { AudioCancelReason } from "./telemetry";
import type { AudioSettings, PlaybackHandle, PlaybackResult, SfxCue, SpeakOptions } from "./types";

let getSettings: () => AudioSettings = () => DEFAULT_AUDIO_SETTINGS;
let lastPlayedAt: Partial<Record<SfxCue, number>> = {};

/**
 * Callbacks run before `stopAllAudio` tears down the transport.
 *
 * @remarks
 * The sequencer needs to abort its pending steps when audio stops, but the manager cannot import
 * the sequencer (the sequencer already imports `speak`/`playSfx` from here). A hook registry keeps
 * the dependency one-directional.
 */
const stopHooks = new Set<(reason: AudioCancelReason) => void>();

export function registerAudioStopHook(hook: (reason: AudioCancelReason) => void): () => void {
    stopHooks.add(hook);
    return () => {
        stopHooks.delete(hook);
    };
}

/**
 * Injects the live settings source. Called once by `AudioProvider`.
 * Until then the manager uses permissive defaults, so audio still works outside the provider
 * (e.g. in unit tests).
 */
export function configureAudio(options: { getSettings: () => AudioSettings }): void {
    getSettings = options.getSettings;
}

function shouldThrottle(cue: SfxCue): boolean {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const last = lastPlayedAt[cue] ?? 0;
    if (now - last < SFX_THROTTLE_MS[cue]) return true;
    lastPlayedAt[cue] = now;
    return false;
}

/** Plays a short UI/game cue. Fire-and-forget: cues never queue and never block gameplay. */
export function playSfx(cue: SfxCue): void {
    const settings = getSettings();
    if (settings.sfxMuted || settings.sfxVolume <= 0) return;

    const ctx = getContext();
    const input = getSfxInput();
    if (!ctx || !input || shouldThrottle(cue)) return;

    scheduleWhenRunning(ctx, () => {
        setSfxGain(settings.sfxVolume);
        scheduleCue(ctx, input, cue);
    });
}

function suppressed(reason: string, source: string): PlaybackHandle {
    emitAudioEvent({ type: "suppressed", source, reason });
    return {
        done: Promise.resolve<PlaybackResult>({ status: "suppressed", reason }),
        cancel: () => undefined,
    };
}

/**
 * Speaks Japanese text.
 *
 * @returns A handle whose `done` promise resolves with the real outcome — completed, cancelled,
 *   failed, or suppressed by a setting or the speech policy.
 */
export function speak(text: string, options: SpeakOptions): PlaybackHandle {
    const { trigger, source, stage = "feedback", questionType } = options;
    const settings = getSettings();

    if (settings.voiceMuted || settings.voiceVolume <= 0) {
        return suppressed("voice-muted", source);
    }
    if (trigger === "auto" && !settings.autoPlay) {
        return suppressed("autoplay-disabled", source);
    }
    if (!allowSpeech({ stage, trigger, questionType })) {
        return suppressed("policy", source);
    }

    return {
        done: speakNow(text, { volume: settings.voiceVolume, source }),
        cancel: () => stopVoice("new-playback"),
    };
}

/** Stops all pronunciation. UI cues are left alone — a click during navigation is fine. */
export function stopAllAudio(reason: AudioCancelReason = "navigation"): void {
    stopHooks.forEach((hook) => hook(reason));
    stopVoice(reason);
}

/** Test seam. */
export function resetAudioManager(): void {
    getSettings = () => DEFAULT_AUDIO_SETTINGS;
    lastPlayedAt = {};
}
