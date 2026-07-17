import path from "node:path";
import { fileURLToPath } from "node:url";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname =
    typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
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
            {
                extends: true,
                plugins: [
                    storybookTest({
                        configDir: path.join(dirname, ".storybook"),
                    }),
                ],
                optimizeDeps: {
                    include: [
                        "aria-query",
                        "lz-string",
                        "@testing-library/dom",
                        "@testing-library/jest-dom",
                    ],
                },
                test: {
                    name: "storybook",
                    browser: {
                        enabled: true,
                        headless: true,
                        provider: playwright({}),
                        instances: [
                            {
                                browser: "chromium",
                            },
                        ],
                    },
                },
            },
        ],
    },
});
