# Kana & Nihongo Master

A Japanese-learning web app: kana drills, SRS flashcard decks with collaborative sharing,
arcade game modes, a notification platform and an admin console.

**The npm package root is `src/`, not the repository root.** Every command below runs from there.

## Stack

| | |
| --- | --- |
| App | Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 |
| Data | Firebase — Firestore, Auth, Storage, Cloud Functions, Remote Config |
| Server logic | Next.js Server Actions via `next-safe-action` · Firebase Admin SDK |
| Client state | Zustand · TanStack Query · React Context for realtime subscriptions |
| UI | Base UI primitives wrapped in `shared/components/ui` · `motion` · lucide-react |
| i18n | `next-intl`, `[locale]` routes, English and Japanese in lockstep |

## Getting started

```bash
cd src
npm install
cp .env.example .env.local     # fill in the six NEXT_PUBLIC_FIREBASE_* values
npm run dev
```

`.env.example` is the environment contract: every variable the code reads is listed there,
with what actually stops working when it is unset. Most integrations are env-gated no-ops that
disable themselves quietly rather than failing, so a missing value is often invisible until
something silently does nothing.

## Commands

```bash
npm run dev        # dev server
npm run build      # production build (also the typecheck gate)
npm run lint       # eslint — blocking in CI
npm test           # unit tests
npm run check:vocab  # asserts shared vocabularies agree across TS, rules and writers
```

See [docs/testing.md](docs/testing.md) for the other four test tiers.

## Layout

```
src/
├── app/        Next.js App Router. Routes are thin mounts.
├── features/   9 features — THE primary unit of organization.
├── shared/     Cross-cutting UI, hooks, utils, providers, audio.
├── lib/        Framework/infra: firebase, auth-session, logging, store.
├── functions/  Cloud Functions (own package.json, own CI job).
├── e2e/        Playwright specs.
└── i18n/ messages/   next-intl config and the en/ja catalogs.
```

The nine features are `flashcard`, `admin`, `kana`, `notifications`, `ai`, `game`, `user`,
`command-palette` and `home`.

### The layer contract

Enforced by ESLint at `error` severity, not by convention:

```
app/            routes are thin mounts
  └─> features/<f>   via its ROOT BARREL only — @/features/<f> or @/features/<f>/server
        ├─ components/  UI only
        ├─ hooks/       orchestration, no Firestore
        ├─ services/    ALL Firestore I/O lives here
        ├─ domain/      pure logic, no React, no Firebase
        └─ actions/     "use server" Server Actions
  └─> shared/, lib/    features may import these; lib may NOT import features
```

**Never open a Firestore listener outside a service.** Every `onSnapshot` call in the codebase
is in a `services/` file, and the boundary rules are lint errors.

## Auth and permissions

Sign-in is Google OAuth only. The session is an httpOnly, server-minted cookie
(`lib/auth-session.ts`); the client never reads credentials from `document.cookie`. The edge
proxy is routing UX, not an authorization boundary — server actions re-verify identity from a
verified ID token, and the client supplies intent, never identity.

Two RBAC engines exist deliberately and are not merged: deck-sharing roles
(`owner > editor > commenter > viewer > none`, resolved only through `resolveRole()`) and admin
authority. Public link access is capped at `commenter`.

## Invariants worth knowing before you change things

- **Audio.** Everything that makes noise goes through `shared/audio`. Feature code never
  touches `AudioContext`, `HTMLAudioElement` or `speechSynthesis` directly — see
  [its README](src/shared/audio/README.md).
- **Reads.** Realtime data comes from a `subscribeX()` in a service, mounted once by a
  Context; one-shot reads go through the TanStack-Query bridge. Mounting a hook N times must
  not open N listeners.
- **Writes.** Client writes go service → `writeBatch`/`setDoc`. Anything privileged or
  cross-user goes through a `"use server"` action that derives the actor from a verified ID
  token.
- **Queries are bounded.** Every list query carries a `limit()`, and the UI renders absent
  data as absent — never as a fabricated zero.
- **Feature flags** come from Firebase Remote Config, read server-side, degrading to defaults.
- **Config is single-sourced.** [`src/.env.example`](src/.env.example) is the environment
  contract: every variable the code reads, and what silently stops working when it is unset.

## Documentation

- [docs/testing.md](docs/testing.md) — the five test tiers and how to run them
