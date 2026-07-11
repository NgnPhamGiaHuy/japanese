import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Emulator-backed test config (Epic 1.1). Runs ONLY the tests that need the
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
        },
    },
    test: {
        environment: "node",
        include: ["**/*.emu.test.ts", "**/firestore-rules.test.ts"],
        // Emulator round-trips are slower than pure unit tests.
        testTimeout: 20_000,
        hookTimeout: 30_000,
    },
});
