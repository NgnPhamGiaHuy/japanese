// Independent flat config for the functions/ package — a separately
// deployed Node package (own package.json, own tsconfig targeting Node/ES2022
// with no DOM lib), so it is excluded from the Next.js app's root
// eslint.config.mjs (see that file's globalIgnores) rather than sharing its
// React/browser-flavored ruleset. Run via `npm run lint` inside functions/.
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
    globalIgnores(["lib/**", "node_modules/**"]),
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
        },
    },
]);
