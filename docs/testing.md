# Testing

Five tiers. All commands run from `src/`.

| Tier | Command | Needs | Covers |
| --- | --- | --- | --- |
| Unit | `npm test` | nothing | Pure logic and hooks in a plain `node` Vitest env |
| Component | `npm run test:browser` | Playwright Chromium | Real-DOM component and hook behaviour — focus, keyboard, rendering |
| Emulator | `npm run test:emu` | Firebase CLI + JDK 21+ | Firestore/Auth integration and `firestore.rules`, via `firebase emulators:exec` |
| E2E | `npm run test:e2e` | Firebase CLI + JDK 21+ | Full journeys against a dev server wired to the emulators |
| Functions | `npm run test:functions` | Firebase CLI + JDK 21+ | Cloud Functions, in their own package |

`npm test` deliberately **excludes** `*.emu.test.ts` and `firestore-rules.test.ts`
(`vitest.config.ts`) so it stays green with no infrastructure. The emulator tier is also
excluded from the app's typecheck (`tsconfig.json`), so a missing emulator dependency can
never break `next build`.

## Emulator prerequisites

```bash
npm install                # installs @firebase/rules-unit-testing
npm i -g firebase-tools    # or use npx
```

A **JDK 21 or newer** must be on `PATH` — the Firestore emulator is a JVM process and
firebase-tools rejects older Java. To run the emulators by hand:

```bash
npm run emulators:start
```

## How the tiers are chosen

Coverage follows risk (ADR-117), not file count:

- **Unit** for pure functions and derivation logic — the default.
- **Component** only where a real DOM is genuinely required. `renderHook` needs a render
  target, and dnd-kit, focus traps and keyboard interaction do not behave correctly in jsdom.
- **Emulator** for anything that touches Firestore or security rules. Server Actions are
  tested here too, against real ID tokens minted from the Auth emulator.
- **E2E** for journeys that cross the whole stack — sign-in through to a rendered protected
  route, and realtime delivery.

Sign-in in the emulator tiers goes through `window.__e2eSignIn`, a test-only bridge defined in
`lib/firebase.ts` behind a double gate (an explicit env var **and** a non-production
`NODE_ENV`). The real login screen offers Google OAuth only, which automation cannot drive.

## CI

`.github/workflows/ci.yml` runs five jobs: `build-lint-test`, `emulator-rules-tests`,
`functions-tests`, `e2e-tests`, and a Cloud Functions deploy that is gated behind repository
variables and skips cleanly when they are unset. **Lint is blocking.**
