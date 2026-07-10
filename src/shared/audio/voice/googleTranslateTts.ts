"use client";

/**
 * Voice transport: the Google Translate TTS endpoint with a browser-speech fallback.
 *
 * @remarks
 * This is the app's only pronunciation transport, and it is the known-fragile one documented in
 * AUDIO_SYSTEM_ROOT_CAUSE_ANALYSIS.md: an undocumented, rate-limited, uncacheable endpoint (RC-1)
 * backed by a fallback that has no Japanese voice on many devices (RC-2).
 *
 * It is confined to this file so a tiered provider chain can replace it without touching a single
 * call site. Scheduling, delays and cancellation policy belong to the sequencer; this module only
 * knows how to start a pronunciation and how to stop one.
 */
import { emitAudioEvent } from "../telemetry";

import type { AudioCancelReason } from "../telemetry";
import type { PlaybackResult } from "../types";

const JAPANESE_VOICE_PRIORITY = [
    "Google 日本語",
    "Google Japanese",
    "Microsoft Nanami",
    "Microsoft Haruka",
    "Kyoko",
    "Otoya",
    "Ayumi",
    "Haruka",
] as const;

const TTS_ENDPOINT = "https://translate.google.com/translate_tts";
const MAX_TTS_TEXT_LENGTH = 180;
const SPEECH_RATE = 0.82;
const SILENT_AUDIO_SRC =
    "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQQAAAAAAA==";

export interface VoicePlaybackOptions {
    /** 0–1. Applied to both the media element and the speech utterance. */
    volume?: number;
    /** Telemetry origin tag. */
    source: string;
}

/** Resolves the promise handed back to the caller for the currently audible playback. */
interface ActivePlayback {
    token: number;
    settle: (result: PlaybackResult) => void;
}

let currentAudio: HTMLAudioElement | null = null;
let selectedJapaneseVoiceURI: string | null = null;
let mediaUnlocked = false;
let playbackToken = 0;
let active: ActivePlayback | null = null;
let voicesWarmed = false;

function isBrowser(): boolean {
    return typeof window !== "undefined";
}

function settleActive(result: PlaybackResult): void {
    if (!active) return;
    const { settle } = active;
    active = null;
    settle(result);
}

function normalizePronunciationText(text: string): string {
    const collapsed = text.trim().replace(/\s+/g, " ");
    if (collapsed.length > MAX_TTS_TEXT_LENGTH) {
        emitAudioEvent({ type: "truncated", originalLength: collapsed.length });
    }
    return collapsed.slice(0, MAX_TTS_TEXT_LENGTH);
}

function getSpeechSynthesis(): SpeechSynthesis | null {
    if (!isBrowser()) return null;
    return window.speechSynthesis ?? null;
}

function stopCurrentMedia(): void {
    if (!currentAudio) return;
    currentAudio.pause();
    currentAudio.removeAttribute("src");
    currentAudio.load();
    currentAudio = null;
}

/**
 * Stops audible pronunciation and settles its promise as cancelled.
 *
 * @remarks
 * The token increment MUST happen before teardown. `stopCurrentMedia` calls `load()` after
 * removing `src`, which can synchronously fire an `error` event on the detached element; the
 * stale-token guard in `fallbackToSpeech` is what stops that from triggering a phantom
 * speech-synthesis playback. Reordering these lines reintroduces double-speech.
 */
function stopActivePronunciation(reason: AudioCancelReason): void {
    const wasActive = active !== null;
    playbackToken += 1;
    getSpeechSynthesis()?.cancel();
    stopCurrentMedia();

    if (wasActive) {
        emitAudioEvent({ type: "cancelled", by: reason });
        settleActive({ status: "cancelled", reason });
    }
}

function buildTtsUrl(text: string): string {
    const params = new URLSearchParams({ ie: "UTF-8", client: "tw-ob", tl: "ja", q: text });
    return `${TTS_ENDPOINT}?${params.toString()}`;
}

function getJapaneseVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | undefined {
    const allVoices = synth.getVoices();
    if (allVoices.length === 0) emitAudioEvent({ type: "voices_empty" });

    const japaneseVoices = allVoices.filter((voice) => {
        const lang = voice.lang.toLowerCase().replace("_", "-");
        return lang === "ja-jp" || lang.startsWith("ja-");
    });

    if (japaneseVoices.length === 0) {
        emitAudioEvent({ type: "no_ja_voice" });
        return undefined;
    }

    const cachedVoice = selectedJapaneseVoiceURI
        ? japaneseVoices.find((voice) => voice.voiceURI === selectedJapaneseVoiceURI)
        : undefined;
    if (cachedVoice) return cachedVoice;

    const preferredVoice =
        JAPANESE_VOICE_PRIORITY.map((name) =>
            japaneseVoices.find((voice) => voice.name.includes(name)),
        ).find(Boolean) ?? japaneseVoices[0];

    selectedJapaneseVoiceURI = preferredVoice.voiceURI;
    return preferredVoice;
}

function handleVoicesChanged(): void {
    getSpeechSynthesis()?.getVoices();
}

/**
 * Primes the browser's voice list exactly once per page.
 *
 * @remarks
 * This previously registered a fresh `voiceschanged` listener on every single pronunciation.
 * `{ once: true }` only removes a listener that actually fires, and on a browser whose voices are
 * already loaded it never fires again — so listeners accumulated without bound.
 */
function ensureVoicesWarm(): void {
    if (voicesWarmed) return;
    const synth = getSpeechSynthesis();
    if (!synth) return;

    voicesWarmed = true;
    synth.getVoices();
    if (typeof synth.addEventListener === "function") {
        synth.addEventListener("voiceschanged", handleVoicesChanged);
    }
}

function playBrowserSpeech(text: string, token: number, volume: number): void {
    const synth = getSpeechSynthesis();
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
        emitAudioEvent({ type: "failure", reason: "speech-unavailable" });
        settleActive({ status: "failed", reason: "speech-unavailable" });
        return;
    }
    if (playbackToken !== token) return;

    emitAudioEvent({ type: "tier_start", tier: "speech" });

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getJapaneseVoice(synth);

    utterance.lang = "ja-JP";
    utterance.rate = SPEECH_RATE;
    utterance.pitch = 1;
    utterance.volume = volume;
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
        if (playbackToken !== token) return;
        emitAudioEvent({ type: "tier_result", tier: "speech", ok: true });
        settleActive({ status: "completed", tier: "speech" });
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        if (playbackToken !== token) return;
        const reason = event?.error ?? "unknown";
        emitAudioEvent({ type: "tier_result", tier: "speech", ok: false, reason });
        emitAudioEvent({ type: "failure", reason: `speech:${reason}` });
        settleActive({ status: "failed", tier: "speech", reason });
    };

    try {
        synth.cancel();
        synth.resume();
        synth.speak(utterance);
    } catch {
        emitAudioEvent({ type: "tier_result", tier: "speech", ok: false, reason: "threw" });
        emitAudioEvent({ type: "failure", reason: "speech-threw" });
        settleActive({ status: "failed", tier: "speech", reason: "threw" });
    }
}

function playMediaPronunciation(text: string, token: number, volume: number): void {
    if (!isBrowser() || typeof Audio === "undefined") {
        emitAudioEvent({ type: "fallback", from: "media", reason: "no-audio-constructor" });
        playBrowserSpeech(text, token, volume);
        return;
    }

    let audio: HTMLAudioElement;
    try {
        audio = new Audio(buildTtsUrl(text));
    } catch {
        emitAudioEvent({ type: "fallback", from: "media", reason: "constructor-threw" });
        playBrowserSpeech(text, token, volume);
        return;
    }

    emitAudioEvent({ type: "tier_start", tier: "media" });

    currentAudio = audio;
    audio.preload = "auto";
    audio.volume = volume;

    /** Distinguishes a pre-start failure from a mid-stream stall. */
    let hasStartedPlaying = false;

    const fallbackToSpeech = (reason: string) => {
        if (playbackToken !== token) return;
        emitAudioEvent({
            type: "tier_result",
            tier: "media",
            ok: false,
            reason: hasStartedPlaying ? `${reason}-midstream` : reason,
        });
        emitAudioEvent({ type: "fallback", from: "media", reason });
        if (currentAudio === audio) currentAudio = null;
        playBrowserSpeech(text, token, volume);
    };

    audio.onplaying = () => {
        hasStartedPlaying = true;
    };
    audio.onerror = () => fallbackToSpeech("media-error");
    audio.onended = () => {
        if (currentAudio === audio) currentAudio = null;
        if (playbackToken !== token) return;
        emitAudioEvent({ type: "tier_result", tier: "media", ok: true });
        settleActive({ status: "completed", tier: "media" });
    };

    const playResult = audio.play();
    if (playResult) {
        playResult.catch((error: unknown) => {
            // DOMException is not an Error subclass on every runtime, so read `name` structurally.
            const name = (error as { name?: string } | null)?.name ?? "play-rejected";
            fallbackToSpeech(name);
        });
    }
}

/** Speaks immediately, cancelling anything already playing. */
export function speakNow(text: string, options: VoicePlaybackOptions): Promise<PlaybackResult> {
    if (!isBrowser()) return Promise.resolve({ status: "failed", reason: "ssr" });

    const { volume = 1, source } = options;
    const normalizedText = normalizePronunciationText(text);
    if (!normalizedText) return Promise.resolve({ status: "failed", reason: "empty-text" });

    stopActivePronunciation("new-playback");
    ensureVoicesWarm();
    emitAudioEvent({ type: "attempt", source, textLength: normalizedText.length });

    return new Promise<PlaybackResult>((resolve) => {
        const token = playbackToken;
        active = { token, settle: resolve };
        playMediaPronunciation(normalizedText, token, volume);
    });
}

/** Stops any audible pronunciation. */
export function stopVoice(reason: AudioCancelReason): void {
    if (!isBrowser()) return;
    stopActivePronunciation(reason);
}

// ── Autoplay unlock (media element path) ─────────────────────────────────────

/**
 * Plays a silent clip so the browser will allow later, non-gesture playback.
 *
 * @remarks
 * Called by `unlock.ts` from inside a real gesture handler. Idempotent.
 */
export function primeMediaPlayback(): void {
    if (!isBrowser() || mediaUnlocked || typeof Audio === "undefined") return;

    ensureVoicesWarm();

    try {
        const audio = new Audio(SILENT_AUDIO_SRC);
        audio.volume = 0;
        const playResult = audio.play();
        if (!playResult) {
            mediaUnlocked = true;
            return;
        }

        playResult
            .then(() => {
                mediaUnlocked = true;
                audio.pause();
                audio.removeAttribute("src");
                audio.load();
            })
            .catch(() => undefined);
    } catch {
        mediaUnlocked = false;
    }
}
