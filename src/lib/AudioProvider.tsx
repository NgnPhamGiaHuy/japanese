"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { useAppStore } from "@/lib/app-store";
import { auth } from "@/lib/firebase";
import { ActivityAction } from "@/lib/logging/actions.enum";
import { enqueueClientLog } from "@/lib/logging/browser";
import {
    configureAudio,
    stopAllAudio,
    subscribeAudioEvents,
    suspendAudioContext,
} from "@/shared/audio";

import type { AudioEvent, AudioSettings } from "@/shared/audio";

/** Fraction of qualifying failures forwarded to the audit log. */
const REMOTE_SAMPLE_RATE = 0.05;
/** Hard ceiling per page session — telemetry may never become the dominant write path. */
const MAX_REMOTE_EVENTS_PER_SESSION = 20;

/**
 * Reads the live settings straight from the store on every sound.
 *
 * @remarks
 * Not a subscription: the manager asks at call time, so a toggle takes effect on the very next
 * sound and there is no stale closure to keep in sync.
 */
function readAudioSettings(): AudioSettings {
    const { globalAutoPlay, sfxMuted, voiceMuted, sfxVolume, voiceVolume } = useAppStore.getState();
    return { autoPlay: globalAutoPlay, sfxMuted, voiceMuted, sfxVolume, voiceVolume };
}

/**
 * Only terminal, actionable problems reach the server. Attempts, cancels, suppressions and tier
 * hand-offs stay in the local counters (`getAudioCounters`) and the dev console — they are
 * high-volume and uninteresting individually.
 */
function isReportable(event: AudioEvent): boolean {
    return event.type === "failure" || event.type === "no_ja_voice";
}

function describe(event: AudioEvent): Record<string, unknown> {
    const base: Record<string, unknown> = { eventType: event.type };
    if (event.type === "failure") base.reason = event.reason;
    if (typeof navigator !== "undefined") base.userAgent = navigator.userAgent;
    return base;
}

// Wired at module scope so the manager has real settings before any component can play a sound.
configureAudio({ getSettings: readAudioSettings });

/**
 * Mounts once and owns every cross-cutting audio concern:
 *
 * 1. **Settings injection.** Wires the Zustand store into the framework-free audio manager, which
 *    is what makes "Auto-Play Audio" apply uniformly across all game modes.
 * 2. **Stop on navigation / unload.** Pronunciation lives in module state, not React, so it
 *    survives unmount. Without this, audio started in a study session keeps playing after the user
 *    navigates away, and a scheduled pronunciation fires on the next route.
 * 3. **Remote telemetry sink.** Sampled and capped, so the production failure distribution can be
 *    measured rather than guessed at.
 */
export function AudioProvider() {
    const pathname = usePathname();
    const isFirstPathRef = useRef(true);

    useEffect(() => {
        if (isFirstPathRef.current) {
            isFirstPathRef.current = false;
            return;
        }
        stopAllAudio("navigation");
    }, [pathname]);

    useEffect(() => {
        const handlePageHide = () => stopAllAudio("pagehide");
        window.addEventListener("pagehide", handlePageHide);
        return () => window.removeEventListener("pagehide", handlePageHide);
    }, []);

    /**
     * A hidden tab is a silent tab.
     *
     * @remarks
     * Pronunciation lives in module state and an `<audio>` element, neither of which the browser
     * pauses for a backgrounded tab — so a study session left in another window kept talking. On
     * return we resume the context but never replay the cancelled utterance: the learner has moved
     * on, and a stale pronunciation arriving late is worse than silence.
     */
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState !== "hidden") return;
            stopAllAudio("hidden");
            suspendAudioContext();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    useEffect(() => {
        let remaining = MAX_REMOTE_EVENTS_PER_SESSION;

        return subscribeAudioEvents((event) => {
            if (remaining <= 0 || !isReportable(event)) return;
            if (Math.random() >= REMOTE_SAMPLE_RATE) return;

            const user = auth.currentUser;
            if (!user) return;

            remaining -= 1;
            enqueueClientLog(() => user.getIdToken(), {
                action: ActivityAction.AUDIO_PLAYBACK_FAILED,
                entityType: "audio",
                level: "warn",
                metadata: describe(event),
            });
        });
    }, []);

    return null;
}
