import { defineConfig } from "vitest/config";

/**
 * functions/'s own vitest config — deliberately separate from the Next.js
 * app's vitest configs (this package has no "@/" alias, no server-only
 * stub, no DOM environment).
 *
 * Every test here is emulator-backed (*.emu.test.ts) — there's no
 * emulator-independent business logic split out (see digest.ts/fanout.ts:
 * grouping stale docs by recipient needs a real Firestore doc snapshot's
 * `.ref.parent.parent` chain, so it isn't meaningfully "pure" in practice).
 * Invoke via `npm run test:emu`, which boots the Firestore/Functions/Storage
 * emulator first.
 */
export default defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.emu.test.ts"],
        testTimeout: 20_000,
        hookTimeout: 30_000,
    },
});
