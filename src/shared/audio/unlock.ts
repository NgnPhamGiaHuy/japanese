"use client";

/**
 * The single gesture-unlock ritual.
 *
 * @remarks
 * Browsers refuse to start audio until the user has interacted with the page, and the two output
 * paths need unlocking separately: the `AudioContext` must be resumed, and a media element must be
 * played once from inside a gesture handler.
 *
 * These used to be two independent listener sets — five in `channels.ts` for the context and five
 * more in the voice transport for the media element — each with its own idea of whether audio was
 * unlocked. One set is enough, and one place to look when it misbehaves.
 *
 * Listeners are removed only once a resume actually succeeds. A gesture that fails to unlock
 * (autoplay policy not yet satisfied) must leave them armed for the next one.
 */
import { getContext, resumeContext } from "./channels";
import { emitAudioEvent } from "./telemetry";
import { primeMediaPlayback } from "./voice/googleTranslateTts";

const UNLOCK_EVENTS: Array<keyof WindowEventMap> = [
    "click",
    "keydown",
    "mousedown",
    "pointerup",
    "touchend",
];

let unlocked = false;

function removeListeners(): void {
    if (typeof window === "undefined") return;
    UNLOCK_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleGesture);
    });
}

function finish(): void {
    if (unlocked) return;
    unlocked = true;
    removeListeners();
    emitAudioEvent({ type: "unlock", ok: true });
}

function handleGesture(): void {
    // Must run synchronously inside the gesture: iOS blesses the element, not the page.
    primeMediaPlayback();

    const ctx = getContext();
    if (!ctx) {
        finish();
        return;
    }

    if (ctx.state !== "suspended") {
        finish();
        return;
    }

    void resumeContext(ctx).then(() => {
        if (ctx.state !== "suspended") finish();
    });
}

if (typeof window !== "undefined") {
    UNLOCK_EVENTS.forEach((eventName) => {
        window.addEventListener(eventName, handleGesture, { passive: true });
    });
}
