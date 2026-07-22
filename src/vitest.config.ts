import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            "@": fileURLToPath(new URL(".", import.meta.url)),
        },
    },
    test: {
        server: {
            deps: {
                // next-intl imports "next/navigation" without an extension
                // (avoids a Next.js deoptimization) — Vitest's resolver
                // needs the module inlined to process that import itself
                // rather than trying to resolve it as a real file on disk.
                // https://next-intl.dev/docs/environments/testing
                inline: ["next-intl"],
            },
        },
        projects: [
            {
                extends: true,
                test: {
                    environment: "node",
                    exclude: [
                        "**/node_modules/**",
                        "**/.next/**",
                        "**/*.emu.test.ts",
                        "**/firestore-rules.test.ts",
                        "**/e2e/**",
                        "**/*.browser.test.{ts,tsx}",
                        // functions/ is a separate Node package with its own
                        // vitest.config.ts — tested independently.
                        "**/functions/**",
                    ],
                },
            },
        ],
    },
});
