/** @type {import("prettier").Config} */
/**
 * Import sorting follows @ianvs/prettier-plugin-sort-imports conventions:
 * @see https://github.com/IanVS/prettier-plugin-sort-imports
 *
 * - Blank lines only where `""` appears in `importOrder` (README §3).
 * - Node built-ins first when present (default tier; README “How import sort works”).
 * - `react` / `next` before other packages (README §1).
 * - Path alias `@/` is grouped with relatives with no blank between them (README §6).
 * - Stylesheets last inside app code (README §2); depth-ordered `../` avoids pure A–Z bugs.
 * - Type-only imports after value imports (README §4).
 *
 * `prettier-plugin-tailwindcss` must stay last in `plugins` (Tailwind + Prettier docs).
 */

/** Blank line between major tiers in `importOrder`. */
const GAP = "";

const MAX_PARENT_DEPTH = 16;

const STYLE_EXT = "(?:css|scss|sass|less)";
/** Non-stylesheet sources (so `*.css` can be matched later and sort last). */
const nonStyleSource = `(?!.*\\.${STYLE_EXT}$)`;

const sameFolderNonStyle = `^\\.(?!\\.)${nonStyleSource}`;

const parentRelativeAtDepth = (depth) => `^(?:\\.\\./){${depth}}(?!\\.)${nonStyleSource}`;

const parentRelativeByDepth = Array.from({ length: MAX_PARENT_DEPTH }, (_, i) =>
    parentRelativeAtDepth(i + 1),
);

const parentRelativeRestNonStyle = `^\\.\\/${nonStyleSource}`;

const relativeStylesheet = `^[./].*\\.${STYLE_EXT}$`;

const withTypePrefix = (valuePattern) => `<TYPES>${valuePattern}`;

/** Value imports: alias + relatives + styles (one contiguous block, no GAP inside). */
const internalValuePatterns = [
    "^@/(.*)$",
    sameFolderNonStyle,
    ...parentRelativeByDepth,
    parentRelativeRestNonStyle,
    relativeStylesheet,
];

/** Type-only imports mirroring `internalValuePatterns` (still one block, no GAP inside). */
const internalTypePatterns = internalValuePatterns.map(withTypePrefix);

module.exports = {
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    tabWidth: 4,
    printWidth: 100,
    bracketSpacing: true,
    arrowParens: "always",
    endOfLine: "auto",
    plugins: ["@ianvs/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],
    importOrder: [
        "<BUILTIN_MODULES>",
        GAP,
        "^(react|next)(.*)$",
        GAP,
        "<THIRD_PARTY_MODULES>",
        GAP,
        ...internalValuePatterns,
        GAP,
        "<TYPES>",
        ...internalTypePatterns,
    ],
    /** Plugin default; natural sort for paths and import specifiers (README). */
    importOrderCaseSensitive: false,
    importOrderParserPlugins: ["typescript", "jsx"],
    importOrderTypeScriptVersion: "5.0.0",
};
