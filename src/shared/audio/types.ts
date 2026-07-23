import type { AudioTier } from "./telemetry";

export type SfxCue = "correct" | "wrong" | "click";

/**
 * Who asked for this sound.
 *
 * `auto` playback is suppressed when the user turns off "Auto-Play Audio"; `user` playback (a tap
 * on a speaker button) always plays, because a mute toggle already exists for that.
 */
export type SpeakTrigger = "auto" | "user";

/** Where in a question's lifecycle the sound would play. */
export type AudioStage = "prompt" | "feedback";

export interface SpeakOptions {
    trigger: SpeakTrigger;
    /** Free-form origin tag, used only for telemetry attribution (e.g. `"speed"`, `"kana-chart"`). */
    source: string;
    /** Defaults to `"feedback"`. `"prompt"` is gated by the speech policy. */
    stage?: AudioStage;
    /** Consulted by the speech policy for prompt-stage playback. */
    questionType?: string;
}

type PlaybackStatus =
    /** Audio played to its end. */
    | "completed"
    /** Superseded by a newer request, or stopped by navigation/unload. */
    | "cancelled"
    /** Every transport tier failed. The user heard nothing. */
    | "failed"
    /** Blocked before playback by a user setting or the speech policy. */
    | "suppressed";

export interface PlaybackResult {
    status: PlaybackStatus;
    tier?: AudioTier;
    reason?: string;
}

export interface PlaybackHandle {
    done: Promise<PlaybackResult>;
    cancel(): void;
}

/** Read at call time, so settings changes take effect without resubscribing. */
export interface AudioSettings {
    /** `globalAutoPlay` — gates every `trigger: "auto"` request, in every mode. */
    autoPlay: boolean;
    sfxMuted: boolean;
    voiceMuted: boolean;
    /** 0–1. */
    sfxVolume: number;
    /** 0–1. */
    voiceVolume: number;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
    autoPlay: true,
    sfxMuted: false,
    voiceMuted: false,
    sfxVolume: 1,
    voiceVolume: 1,
};
