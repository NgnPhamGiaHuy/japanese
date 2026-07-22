import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
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
        // WARNING first, not an error — the repo has 47 pre-existing files over
        // the limit (verified count, not the earlier "~46" estimate); tighten to
        // "error" per file as they're split (see R31/E11).
        files: ["**/*.{ts,tsx}"],
        rules: {
            "max-lines": ["warn", { max: 200 }],
        },
    },

    // ─── Cross-feature import boundary (ADR-101, T-101c) ───────────────────────
    //
    // A feature's public API is its root barrel (`@/features/<f>`) or, for
    // server-only code, `@/features/<f>/server` (ADR-101 Amendment 1). Reaching
    // past either into a feature's internals — from another feature or from the
    // route layer — is how the repo's only value-import cycle formed (W-1) and
    // is exactly the openness T-101a/b just closed. This makes it a build-time
    // error instead of a convention, the same way the audio rule above does for
    // `shared/audio` after a real incident (S-15).
    //
    // Deliberately does NOT restrict lib/**: that back-edge (lib/logging used to
    // import from features/admin) is ADR-103's concern, landing separately as
    // T-103b, with lib/providers.tsx as its own composition-root exception.
    // Nothing here needs to name providers.tsx — it already imports only bare
    // feature barrels (post-T-101b), so it violates no zone below.
    //
    // Test and story files are exempt: mocking a cross-feature module by its
    // real specifier (`vi.mock("@/features/x/actions/y")`) is not a runtime
    // coupling — the whole point of a mock is to replace what it names.
    ...(() => {
        // One entry per feature — every feature has these two names whether or
        // not `server.ts` exists for it; an except pointing at a file that
        // doesn't exist just never matches, harmlessly.
        const FEATURES = [
            "admin",
            "ai",
            "command-palette",
            "flashcard",
            "game",
            "home",
            "kana",
            "notifications",
            "user",
        ];
        const PUBLIC_ENTRY_POINTS = FEATURES.flatMap((f) => [`${f}/index.ts`, `${f}/server.ts`]);
        const MESSAGE =
            "Import the owning feature's public API instead — `@/features/<feature>` " +
            "or, for server-only code, `@/features/<feature>/server`. See ADR-101 " +
            "(architecture-decision/03-Architecture-Decisions.md) and its Amendment 1.";
        const TEST_AND_STORY_FILES = [
            "**/*.test.{ts,tsx}",
            "**/*.browser.test.{ts,tsx}",
            "**/*.stories.tsx",
        ];

        return [
            {
                // features/<F> may import its OWN internals freely, and every
                // feature's public entry points — never another feature's internals.
                files: ["features/*/**/*.{ts,tsx}"],
                ignores: TEST_AND_STORY_FILES,
                rules: {
                    "import/no-restricted-paths": [
                        "error",
                        {
                            zones: FEATURES.map((f) => ({
                                target: `./features/${f}`,
                                from: "./features",
                                except: [f, ...PUBLIC_ENTRY_POINTS],
                                message: MESSAGE,
                            })),
                        },
                    ],
                },
            },
            {
                // The route layer may only mount a feature's public entry
                // points — never reach into its internals directly.
                files: ["app/**/*.{ts,tsx}"],
                ignores: TEST_AND_STORY_FILES,
                rules: {
                    "import/no-restricted-paths": [
                        "error",
                        {
                            zones: [
                                {
                                    target: "./app",
                                    from: "./features",
                                    except: PUBLIC_ENTRY_POINTS,
                                    message: MESSAGE,
                                },
                            ],
                        },
                    ],
                },
            },
            {
                // lib/ never imports features/ — not even a feature's public
                // entry points (ADR-103). Shared infrastructure depending on a
                // feature cannot be reasoned about or extracted without it, and
                // is how the admin <-> lib/logging cycle formed (T-103a). The
                // one sanctioned exception is the composition root, excluded
                // from this rule entirely rather than zone-excepted: providers.tsx
                // legitimately imports several features' bare barrels to mount
                // their providers, so "no exceptions" is enforced by not
                // checking that one file, not by carving out per-feature paths.
                files: ["lib/**/*.{ts,tsx}"],
                ignores: ["lib/providers.tsx", ...TEST_AND_STORY_FILES],
                rules: {
                    "import/no-restricted-paths": [
                        "error",
                        {
                            zones: [
                                {
                                    target: "./lib",
                                    from: "./features",
                                    message:
                                        "lib/ may not import from features/ — only the composition " +
                                        "root (lib/providers.tsx) may. See ADR-103 " +
                                        "(architecture-decision/03-Architecture-Decisions.md).",
                                },
                            ],
                        },
                    ],
                },
            },
        ];
    })(),

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
]);

export default eslintConfig;
