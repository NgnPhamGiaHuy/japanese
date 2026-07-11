import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            "@": fileURLToPath(new URL(".", import.meta.url)),
        },
    },
    test: {
        environment: "node",
        // Emulator-backed tests (*.emu.test.ts) and the security-rules suite
        // require the Firestore/Auth emulator + @firebase/rules-unit-testing and
        // run via `npm run test:emu` (vitest.emu.config.ts). Exclude them from
        // the default unit run so `npm test` stays green without infra.
        exclude: [
            "**/node_modules/**",
            "**/.next/**",
            "**/*.emu.test.ts",
            "**/firestore-rules.test.ts",
        ],
    },
});
