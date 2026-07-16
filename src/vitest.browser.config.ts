import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

/**
 * Real-browser component tests (Chromium via the Playwright provider) — for
 * behavior jsdom can't reliably prove: focus management, Tab order, and
 * keyboard interaction (Escape-to-close, focus trap). The app's only prior
 * component test called a component as a plain function and inspected the
 * returned element tree — it never touched a real DOM. This is the real
 * thing, and the safety net E6's headless-primitive swaps (Modal, Select,
 * SettingsMenu) will run against.
 *
 * Separate from vitest.config.ts (node-env unit tests) and
 * vitest.emu.config.ts (Firestore/Auth emulator tests), matching this
 * project's existing per-concern config split. Invoke via `npm run
 * test:browser`.
 */
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL(".", import.meta.url)),
        },
    },
    // @base-ui/react/select's internal useFormContext hook pulls in a nested
    // module subtree that Vite's dep optimizer doesn't discover before the
    // single-shot `vitest run` test import happens, producing a duplicate
    // React module instance ("Invalid hook call" / useContext returning
    // null) — same class of cold-optimizer issue as vitest.config.ts's
    // storybook project. Forcing it into optimizeDeps pre-bundles its whole
    // subtree with one React copy.
    optimizeDeps: {
        include: [
            "@base-ui/react/select",
            "react-hook-form",
            "@hookform/resolvers/zod",
            "@tanstack/react-virtual",
            "next/navigation",
            "fractional-indexing",
        ],
    },
    // Components that import `next/link` (even transitively, through a
    // shared barrel file) pull in Next.js's client router internals
    // (has-base-path.js, resolve-href.js), which read `process.env.*` and
    // throw "process is not defined" outside a Next.js runtime. Vitest
    // Browser Mode has no Next runtime, so define a minimal `process.env`
    // shim — Next's own code already falls back gracefully on unset vars.
    define: {
        "process.env": {},
    },
    test: {
        include: ["**/*.browser.test.{ts,tsx}"],
        exclude: ["**/node_modules/**", "**/.next/**"],
        browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
            headless: true,
        },
    },
});
