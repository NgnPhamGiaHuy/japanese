/**
 * @file flags
 * Server-side feature-flag resolution via Firebase Remote Config's server
 * template API (see docs/adr/003-feature-flags.md for why Remote Config
 * over PostHog flags).
 */

import "server-only";

import { adminRemoteConfig } from "./firebase-admin";

import type { ServerTemplate } from "firebase-admin/remote-config";

/**
 * Default-safe values — passed to Remote Config as its own in-app defaults
 * (so the app behaves correctly before the very first successful fetch) and
 * used again as the fallback if Remote Config is unreachable or misconfigured.
 * Every flag here MUST be safe when "off" — this is the kill-switch state.
 */
const DEFAULT_FLAGS = {
    maintenance_mode: false,
    locale_switch_enabled: false,
} as const;

type FlagKey = keyof typeof DEFAULT_FLAGS;
type Flags = { [K in FlagKey]: (typeof DEFAULT_FLAGS)[K] extends boolean ? boolean : never };

// Remote Config server templates don't push updates — the SDK only sees a
// flip once you call load() again. A short TTL keeps "without a redeploy"
// genuinely true (flags propagate within ~1 minute) without fetching on
// every single request.
const TEMPLATE_TTL_MS = 60_000;

let cachedTemplate: ServerTemplate | null = null;
let cachedAt = 0;

async function getTemplate(): Promise<ServerTemplate> {
    const now = Date.now();
    if (cachedTemplate && now - cachedAt < TEMPLATE_TTL_MS) {
        return cachedTemplate;
    }

    try {
        const template = await adminRemoteConfig.getServerTemplate({
            defaultConfig: DEFAULT_FLAGS,
        });
        cachedTemplate = template;
        cachedAt = now;
        return template;
    } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "remote-config/not-found") {
            // No server template has been published for this project yet —
            // expected until someone creates one in the Firebase console, not
            // a real failure. DEFAULT_FLAGS below covers this correctly.
            console.warn("[flags] No Remote Config server template published yet; using defaults.");
        } else {
            console.error("[flags] Remote Config fetch failed, using defaults:", err);
        }
        // Re-serve the stale template rather than defaults if we have one —
        // an outage shouldn't flip already-resolved flags back to default.
        if (cachedTemplate) return cachedTemplate;
        throw err;
    }
}

/**
 * Resolves all server-side feature flags for the current request.
 *
 * @remarks
 * Never throws — a Remote Config outage with no prior successful fetch
 * falls back to DEFAULT_FLAGS (safe values), logging the error rather than
 * breaking the request. Callers pass the resolved booleans to client
 * components as plain props; nothing here is exposed to the client bundle
 * (this whole module is `server-only`).
 */
export async function getFlags(): Promise<Flags> {
    try {
        const template = await getTemplate();
        const config = template.evaluate();
        return {
            maintenance_mode: config.getBoolean("maintenance_mode"),
            locale_switch_enabled: config.getBoolean("locale_switch_enabled"),
        };
    } catch {
        return { ...DEFAULT_FLAGS };
    }
}
