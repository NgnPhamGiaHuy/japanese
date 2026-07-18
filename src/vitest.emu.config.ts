import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Emulator-backed test config. Runs ONLY the tests that need the
 * Firebase Firestore/Auth emulator + @firebase/rules-unit-testing:
 *   - *.emu.test.ts        — integration tests (delivery, subscribe, dedup)
 *   - firestore-rules.test.ts — security-rules tests
 *
 * Invoke via `npm run test:emu`, which boots the emulator first
 * (`firebase emulators:exec`). Requires `npm install` (dev deps) + the Firebase
 * CLI + a JRE. These tests are intentionally excluded from the default
 * `npm test` run (see vitest.config.ts).
 */
export default defineConfig({
    resolve: {
        alias: {
            "@": fileURLToPath(new URL(".", import.meta.url)),
            // "server-only" unconditionally throws outside Next's own build
            // pipeline (it relies on webpack/turbopack's `react-server` export
            // condition to swap in a no-op) — Vitest has no such pipeline, so
            // any test that imports a server action transitively hits it.
            // Alias straight to the package's own no-op stub.
            "server-only": fileURLToPath(
                new URL("./node_modules/server-only/empty.js", import.meta.url),
            ),
        },
    },
    test: {
        environment: "node",
        include: ["**/*.emu.test.ts", "**/firestore-rules.test.ts"],
        // functions/ is a separate Node package with its own emulator-backed
        // vitest config (functions/vitest.config.ts, run via
        // `npm run test:emu` inside functions/) — excluded here so the app's
        // test:emu doesn't double-run it or trip over its Node-only imports.
        exclude: ["**/node_modules/**", "**/functions/**"],
        // Emulator round-trips are slower than pure unit tests.
        testTimeout: 20_000,
        hookTimeout: 30_000,
        // Some *.emu.test.ts files (e.g. user.service.emu.test.ts) exercise a
        // client-SDK service that transitively imports @/lib/firebase, whose
        // module-level getAuth(app) throws auth/invalid-api-key the instant
        // NEXT_PUBLIC_FIREBASE_API_KEY is unset — which it always is here,
        // since this config (deliberately) never loads .env/.env.local. These
        // tests only ever talk to the local emulator via their own
        // rules-unit-testing context, so placeholder values are enough to
        // satisfy the SDK's eager validation; NEXT_PUBLIC_USE_FIREBASE_EMULATOR
        // additionally points the imported (otherwise-unused) auth/db bindings
        // at the same emulator this script boots.
        env: {
            NEXT_PUBLIC_FIREBASE_API_KEY: "test-api-key",
            NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-emu-test.firebaseapp.com",
            NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-emu-test",
            NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "demo-emu-test.firebasestorage.app",
            NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "0",
            NEXT_PUBLIC_FIREBASE_APP_ID: "1:0:web:0",
            NEXT_PUBLIC_USE_FIREBASE_EMULATOR: "true",
        },
    },
});
