"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
    if (typeof window === "undefined" || !window.matchMedia) return () => undefined;

    const media = window.matchMedia(QUERY);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(QUERY).matches;
}

/** Server render cannot know the preference; assume motion is fine and correct on hydration. */
const getServerSnapshot = (): boolean => false;

/**
 * Whether the user has asked their OS to reduce motion.
 *
 * @remarks
 * CSS animations and transitions are already collapsed globally by a `prefers-reduced-motion`
 * block in `globals.css`. Use this hook only for motion that CSS cannot reach — JavaScript-driven
 * effects such as confetti bursts.
 */
export function usePrefersReducedMotion(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
