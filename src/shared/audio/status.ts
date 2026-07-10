"use client";

/**
 * Derives a coarse health signal for pronunciation from the telemetry stream.
 *
 * @remarks
 * Until now, a pronunciation that failed every transport tier was indistinguishable from one that
 * played: `playAudio` returned `void` and swallowed the error, so the learner tapped a speaker
 * button, heard nothing, and had no way to tell whether the app was broken or their device was
 * muted. This module turns that silence into a state the UI can render.
 *
 * It is intentionally simple. When the tiered provider chain arrives, per-tier circuit breakers
 * will supersede this consecutive-failure heuristic.
 */
import { subscribeAudioEvents } from "./telemetry";

export type AudioStatus =
    /** Pronunciation is working, or has not been tried yet. */
    | "ok"
    /** One recent failure. Could be a blip. */
    | "degraded"
    /** Repeated failures — tell the learner rather than leaving them in silence. */
    | "unavailable";

/** Consecutive failures before we admit the feature is broken. */
const UNAVAILABLE_THRESHOLD = 2;

let consecutiveFailures = 0;
let status: AudioStatus = "ok";
const listeners = new Set<() => void>();

function setStatus(next: AudioStatus): void {
    if (status === next) return;
    status = next;
    listeners.forEach((listener) => listener());
}

subscribeAudioEvents((event) => {
    if (event.type === "failure") {
        consecutiveFailures += 1;
        setStatus(consecutiveFailures >= UNAVAILABLE_THRESHOLD ? "unavailable" : "degraded");
        return;
    }

    // Any successful playback proves the chain works again.
    if (event.type === "tier_result" && event.ok) {
        consecutiveFailures = 0;
        setStatus("ok");
    }
});

export function getAudioStatus(): AudioStatus {
    return status;
}

export function subscribeAudioStatus(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
