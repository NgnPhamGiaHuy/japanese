/**
 * Audio telemetry bus.
 *
 * @remarks
 * Every failure branch in the pronunciation pipeline used to be silent, so "pronunciation
 * sometimes fails" was unattributable. This module gives every branch a name and a sink.
 *
 * Deliberately dependency-free: no React, no Firebase, no browser globals beyond an optional
 * `console`. Sinks are installed from the outside so tests can assert on emitted events without
 * stubbing globals, and so `shared/` never reaches into `lib/` or `features/`.
 *
 * `emitAudioEvent` must never throw — a telemetry outage may not break playback.
 */

/** Which transport produced the outcome. */
export type AudioTier = "media" | "speech";

/** Why an in-flight pronunciation was stopped. */
export type AudioCancelReason = "new-playback" | "navigation" | "pagehide" | "hidden";

export type AudioEvent =
    /** A pronunciation was requested. */
    | { type: "attempt"; source: string; textLength: number }
    /** Text exceeded the TTS length cap and was cut (RCA ⓕ1). */
    | { type: "truncated"; originalLength: number }
    /** An audible pronunciation was stopped (RCA ⓕ2). */
    | { type: "cancelled"; by: AudioCancelReason }
    | { type: "tier_start"; tier: AudioTier }
    /** Terminal outcome for one tier. `reason` is set when `ok` is false. */
    | { type: "tier_result"; tier: AudioTier; ok: boolean; reason?: string }
    /** A tier gave up and handed off to the next one. */
    | { type: "fallback"; from: AudioTier; reason: string }
    /** `getVoices()` returned an empty list at speak time (RCA ⓕ9 / RC-8). */
    | { type: "voices_empty" }
    /** No Japanese voice is installed on this device (RCA ⓕ10 / RC-2). */
    | { type: "no_ja_voice" }
    /** Autoplay unlock outcome. */
    | { type: "unlock"; ok: boolean }
    /** Blocked before playback by a user setting or the speech policy. Not a failure. */
    | { type: "suppressed"; source: string; reason: string }
    /** Every tier failed; the user heard nothing. */
    | { type: "failure"; reason: string };

/** A sink receives every event. It must not throw; the bus guards anyway. */
type AudioEventSink = (event: AudioEvent) => void;

const subscribers = new Set<AudioEventSink>();
let counters: Record<string, number> = {};

function bumpCounter(event: AudioEvent): void {
    const key =
        event.type === "failure"
            ? `failure:${event.reason}`
            : event.type === "suppressed"
              ? `suppressed:${event.reason}`
              : event.type === "tier_result"
                ? `tier_result:${event.tier}:${event.ok ? "ok" : (event.reason ?? "error")}`
                : event.type;
    counters[key] = (counters[key] ?? 0) + 1;
}

function isDevelopment(): boolean {
    return typeof process !== "undefined" && process.env?.NODE_ENV === "development";
}

function logToConsole(event: AudioEvent): void {
    if (!isDevelopment() || typeof console === "undefined") return;

    const isProblem =
        event.type === "failure" ||
        event.type === "no_ja_voice" ||
        (event.type === "tier_result" && !event.ok);

    const write = isProblem ? console.warn : console.debug;
    write?.call(console, "[audio]", event);
}

/**
 * Records an event, updates counters, and fans out to every sink.
 * Never throws, whatever the sinks do.
 */
export function emitAudioEvent(event: AudioEvent): void {
    try {
        bumpCounter(event);
        logToConsole(event);
    } catch {
        /* telemetry must never break playback */
    }

    for (const sink of subscribers) {
        try {
            sink(event);
        } catch {
            /* a broken sink must not stop the others */
        }
    }
}

/** Registers a sink. Returns an unsubscribe function. */
export function subscribeAudioEvents(sink: AudioEventSink): () => void {
    subscribers.add(sink);
    return () => {
        subscribers.delete(sink);
    };
}

/**
 * Event counts since process start (or last reset), keyed by type.
 * `failure` and `tier_result` keys carry their reason so the Gate A memo can rank causes.
 */
export function getAudioCounters(): Readonly<Record<string, number>> {
    return { ...counters };
}

/** Test seam. */
export function resetAudioTelemetry(): void {
    counters = {};
    subscribers.clear();
}
