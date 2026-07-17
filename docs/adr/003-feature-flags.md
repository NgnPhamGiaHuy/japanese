# ADR 003 — Managed feature flags: Firebase Remote Config over PostHog flags

**Status**: Accepted, implemented
**Date**: 2026-07-17

## Context

There was no feature-flag mechanism anywhere in the app — no `src/lib/flags.ts`, no flags config
file, no `isEnabled`-style checks. Every "feature" ships live the moment its code merges; there is
no way to stage a rollout or hit a kill switch without a redeploy. This ADR resolves open question
**Q2** from the requirements program: choose one managed flag mechanism.

Two realistic options exist given what's already integrated:

1. **PostHog flags** — the app already has `posthog-js` wired up (`lib/posthog.ts`,
   `lib/PostHogProvider.tsx`) for product analytics, prod-gated and inert in dev without a real API
   key. PostHog's product also offers feature flags on the same account.
2. **Firebase Remote Config** — the app already has a deep Firebase Admin SDK integration
   (`lib/firebase-admin.ts`: `adminAuth`, `adminDb`, now `adminRemoteConfig`) with an established
   lazy-init/credential pattern, and `firebase-admin`'s `remote-config` submodule ships in the
   already-installed package — zero new dependencies.

## Decision

**Firebase Remote Config**, specifically its server template API
(`adminRemoteConfig.getServerTemplate()` → `ServerTemplate.evaluate()` → `ServerConfig`).

Reasons:

- **No new dependency or credential surface.** PostHog flag evaluation server-side would require
  installing `posthog-node` fresh and wiring a second server-side credential/init path alongside
  the Admin SDK's. Remote Config reuses the exact `getAdminApp()`/lazy-proxy pattern
  `firebase-admin.ts` already established for `adminAuth`/`adminDb` — one more line, not a new
  subsystem.
- **Server-side evaluation is the actual requirement.** The acceptance criteria call for
  server-resolved flags passed to the client as props (AC-E14.1) — gating what a Server Component
  renders, not just a client-side UI toggle. PostHog's client SDK (`posthog-js`) evaluates flags in
  the browser; there is no existing server-side PostHog plumbing in this codebase to build on, and
  `posthog-js` itself is prod-gated + inert without a real API key, which would make flags
  non-functional in every non-production environment.
- **Consistency with the project's existing Firebase-first posture.** Auth, Firestore, Storage, and
  (per E14-T2) Cloud Functions all already run through Firebase/GCP. Remote Config keeps flag
  administration in the same console as everything else, rather than splitting operational control
  across two unrelated vendor dashboards.

## Implementation

- `src/lib/firebase-admin.ts` — adds `adminRemoteConfig`, following the exact lazy-proxy pattern
  already used for `adminAuth`/`adminDb`.
- `src/lib/flags.ts` (`server-only`) — `getFlags()`, the single entry point:
  - `DEFAULT_FLAGS` is passed to Remote Config as its own in-app default config (`defaultConfig`
    option) **and** used again as the fallback if Remote Config is unreachable, misconfigured, or —
    the common case for a fresh project — has no server template published yet. Every flag must be
    safe when "off"; this is the kill switch.
  - The fetched template is cached for 60 seconds (`TEMPLATE_TTL_MS`) — long enough to avoid a
    Remote Config round-trip on every request, short enough that "a flag flip changes feature state
    without a redeploy" (AC-E14.1) is genuinely true within about a minute, not "on next deploy."
  - A `[NOT_FOUND]`/`remote-config/not-found` error (no template published yet in the Firebase
    console) is logged as a `console.warn`, not `console.error` — expected state for a project that
    has never used Remote Config, not a real failure.
  - Never throws to its caller. Any other failure logs via `console.error` and falls back to a
    cached template if one exists, or `DEFAULT_FLAGS` otherwise.
- **First real flag**: `maintenance_mode` (boolean, default `false`). The root layout
  (`app/layout.tsx`, already a Server Component) calls `getFlags()` and renders
  `MaintenanceScreen` in place of the whole app when it's on — proves the mechanism end-to-end
  (Remote Config → server resolve → conditional render) with a flag that's genuinely useful on its
  own, not an inert placeholder invented only to exercise the plumbing.
- This mechanism is what E12-T4 (Wave 6, i18n) will reuse to gate the locale switch behind a flag,
  per the requirements program's own sequencing note.

## What was explicitly not done

- **No admin UI to flip flags from within the app.** Flags are managed from the Firebase console
  directly (Remote Config's own UI already provides percentage rollouts, conditions, and staged
  delivery). `AdminSettingsPageContent`'s "not available yet" placeholder is unrelated to this ADR
  and untouched.
- **No client-side flag evaluation.** Every flag consumer today is a Server Component; there is no
  `useFlag()`-style client hook. If a future flag genuinely needs to change behavior *after*
  hydration without a full page reload, that's a new, separate design question — this ADR only
  covers the server-resolved-props shape AC-E14.1 asked for.
- **No migration of "declared-but-inactive" flags.** A repo-wide search (see E14-T1's research)
  found none — every hit for `flag`-shaped identifiers was a false positive (per-document RBAC
  booleans on `Lesson`, an analytics alias table). This was greenfield.

## Consequences

- Adding a new flag means: add its key + safe default to `DEFAULT_FLAGS` in `src/lib/flags.ts`,
  add it to the `Flags` type, read it via `config.getBoolean/getString/getNumber(key)` in
  `getFlags()`, and create the matching parameter in the Firebase console's Remote Config server
  template (namespace `firebase-server`). Until that last step happens for any given key, `getFlags`
  transparently serves the default — a flag can be wired into product code before it's ever
  published in the console, without breaking anything.
- A Remote Config outage degrades to default behavior, never to a crash — verified live: with no
  server template published at all (the actual current state of this project), the app renders
  normally end-to-end, logging one `console.warn` per cache-TTL window rather than failing the
  request.
