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
        // functions/ is a separately deployed Node package (own package.json,
        // own tsconfig, no DOM lib) with its own eslint.config.mjs — linted
        // independently via `npm run lint` inside functions/, not as part of
        // the Next.js app's React/browser-flavored ruleset.
        "functions/**",
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

    // ─── Lint ratchet baseline (Sprint 0) ──────────────────────────────────────
    //
    // CI lint is BLOCKING (.github/workflows/ci.yml). It could not be flipped
    // while these files carried error-level violations that predate the gate, so
    // each is pinned to "warn" below — still reported on every run, no longer
    // able to fail the build for a pre-existing reason.
    //
    // This list is a RATCHET: it may only shrink, never grow. A violation of any
    // error-level rule anywhere else — including the audio boundary above and the
    // import-boundary rules arriving with T-101c — now fails CI. That property is
    // what ADR-101/102/103 enforcement depends on and did not have before
    // (execution-readiness/06 §G-1).
    //
    // Removing a file from these lists is part of "done" for the task that fixes
    // it: T-116a owns the react-hooks entries, T-109a the no-explicit-any ones.
    {
        files: [
            "features/admin/hooks/useAdminRoleCheck.ts",
            "features/ai/hooks/useAIExplanation.ts",
            "features/flashcard/hooks/useDeckProgressStatus.ts",
            "features/flashcard/hooks/useSharedLesson.ts",
            "features/user/hooks/useBestScores.ts",
            "features/user/hooks/useUserProgress.ts",
        ],
        rules: {
            "react-hooks/set-state-in-effect": "warn",
        },
    },
    {
        files: [
            "features/admin/utils/export.utils.ts",
            "features/ai/hooks/useAIImageDeck.ts",
            "features/flashcard/games/speed/engine/memory/CardSelector.ts",
            "features/flashcard/utils/parser.ts",
            "features/kana/quiz/hooks/useQuizState.ts",
        ],
        rules: {
            "@typescript-eslint/no-explicit-any": "warn",
        },
    },
    {
        files: ["features/flashcard/loaders/useFlashcardLoader.ts"],
        rules: {
            "react-hooks/immutability": "warn",
        },
    },
    {
        files: ["features/flashcard/utils/parser.ts"],
        rules: {
            "prefer-const": "warn",
        },
    },
    ...storybook.configs["flat/recommended"],
]);

export default eslintConfig;
