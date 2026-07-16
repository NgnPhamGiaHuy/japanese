// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import storybook from "eslint-plugin-storybook";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    // Override default ignores of eslint-config-next.
    globalIgnores([
        // Default ignores of eslint-config-next:
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),
    {
        // All sound goes through `shared/audio`. Reaching for a browser audio API directly is how
        // the previous system ended up with two competing singletons, a user setting that only
        // half the app honoured, and failures nothing could observe.
        // See docs/adr/001-audio-architecture.md.
        files: ["features/**/*.{ts,tsx}", "app/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
        rules: {
            "no-restricted-globals": [
                "error",
                {
                    name: "Audio",
                    message: "Use `speak()` from @/shared/audio instead of constructing Audio.",
                },
                {
                    name: "AudioContext",
                    message: "Use `playSfx()` from @/shared/audio instead of an AudioContext.",
                },
                {
                    name: "webkitAudioContext",
                    message: "Use `playSfx()` from @/shared/audio instead of an AudioContext.",
                },
                {
                    name: "SpeechSynthesisUtterance",
                    message: "Use `speak()` from @/shared/audio instead of speech synthesis.",
                },
            ],
            "no-restricted-properties": [
                "error",
                {
                    object: "window",
                    property: "speechSynthesis",
                    message: "Use `speak()` from @/shared/audio instead of speech synthesis.",
                },
            ],
        },
    },
    {
        // Self-imposed 200-line ceiling (architecture.rule.md). Introduced as a
        // WARNING first, not an error — the repo has ~46 pre-existing files over
        // the limit; tighten to "error" per file as they're split (see R31/E11).
        files: ["**/*.{ts,tsx}"],
        rules: {
            "max-lines": ["warn", { max: 200 }],
        },
    },
    ...storybook.configs["flat/recommended"],
]);

export default eslintConfig;
