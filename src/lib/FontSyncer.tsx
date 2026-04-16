"use client";

/**
 * @file FontSyncer
 *
 * Mounts once in Providers and syncs the `useHandwriting` Zustand state
 * to the `html.handwriting-font` CSS class — no per-page wiring needed.
 *
 * The CSS class drives the `--font-japanese` CSS custom property which any
 * component in the app can consume via `style={{ fontFamily: "var(--font-japanese)" }}`.
 */
import { useEffect } from "react";

import { useAppStore } from "@/store";

export function FontSyncer() {
    const useHandwriting = useAppStore((s) => s.useHandwriting);

    useEffect(() => {
        const body = document.body;
        if (useHandwriting) {
            body.classList.add("handwriting-font");
        } else {
            body.classList.remove("handwriting-font");
        }
    }, [useHandwriting]);

    // Renders nothing — purely a side-effect component
    return null;
}
