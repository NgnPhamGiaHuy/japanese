import posthog from "posthog-js";

let initialized = false;

/**
 * Prod-gated and key-gated: without NEXT_PUBLIC_POSTHOG_KEY set (no dev/CI
 * credentials are available), this is a no-op in every environment, and it
 * never initializes outside production even when a key is present.
 * autocapture/capture_pageview are off — only the explicit events this app
 * calls out (manual $pageview + product events) are ever sent, so no
 * incidental DOM text/attributes leak as event properties.
 */
export function initPostHog() {
    if (initialized) return;
    if (process.env.NODE_ENV !== "production") return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    posthog.init(key, {
        api_host: "/ingest",
        ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? "https://us.posthog.com",
        person_profiles: "identified_only",
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
    });

    initialized = true;
}

export { posthog };
