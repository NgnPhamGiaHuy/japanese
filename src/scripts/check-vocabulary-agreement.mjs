#!/usr/bin/env node
/**
 * @file scripts/check-vocabulary-agreement.mjs
 * Automated vocabulary-agreement check (ADR-108's automation leg / ADR-115
 * T-115b, OP-19/OP-20).
 *
 * WHY
 * ───
 * Several vocabularies in this app are expressed more than once — a
 * TypeScript union, a `firestore.rules` list, and/or the literal values
 * actual writer code emits — and nothing previously verified they agree.
 * One already drifted (the notification-type union vs. the 10 values
 * actually written). This script is the "same mechanism, configured per
 * vocabulary" fix: one extraction/comparison engine, driven by the
 * VOCABULARIES config below, rather than a bespoke script per union.
 *
 * WHAT IT CHECKS, per configured vocabulary
 * ──────────────────────────────────────────
 *   - `ts`: the canonical TypeScript union (or `as const` tuple) — read as
 *     plain text and regex-extracted (no TS compiler dependency; every
 *     vocabulary here is a single-line union/tuple of string literals).
 *   - `rules` (optional): every string literal firestore.rules compares
 *     that field against. Some vocabularies (e.g. LogSource) are written
 *     exclusively via the Admin SDK, where rules have no opinion at all
 *     (`allow create: if false`) — those configs omit `rules` entirely
 *     rather than comparing against an empty/irrelevant list.
 *   - `writers` (optional): every literal value real producer code actually
 *     emits for that field, across a named set of files.
 *
 * A vocabulary's `mode` is `"enforce"` (mismatch fails the check) or
 * `"report-only"` (mismatch is printed as a warning but does not fail) —
 * the notification-type target runs report-only until T-108a (Wave 5)
 * widens that union to the values already written; wiring it as enforcing
 * now would fail CI on a divergence that is already scheduled to be fixed
 * (see implementation-planning/01-Validated-Backlog.md §5.4).
 *
 * The `rules` comparison is a SUBSET check (every rules-mentioned literal
 * must be a real TS union member), not full-set equality — rules
 * conditions typically test only the specific values one permission gate
 * cares about (e.g. "is this an editor"), not the whole vocabulary. The
 * `writers` comparison is bidirectional: every written value must be a
 * declared union member, AND (enforce mode only) every declared union
 * member should have at least one real writer, so a dead vocabulary value
 * doesn't hide silently.
 *
 * USAGE
 * ─────
 *   node scripts/check-vocabulary-agreement.mjs
 *   npm run check:vocab
 *
 * Exits non-zero (and CI fails) only on an `"enforce"`-mode mismatch.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function readSrc(relPath) {
    return readFileSync(path.join(SRC_ROOT, relPath), "utf8");
}

/** Extracts the string-literal members of `export type Name = "a" | "b";` or `export const NAME = ["a","b"] as const;`, given already-read source text. Pure — no file I/O — so it's directly unit-testable. */
export function parseTsLiterals(source, exportName) {
    const unionMatch = source.match(new RegExp(`export type ${exportName}\\s*=\\s*([^;]+);`));
    if (unionMatch) {
        return [...unionMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    }

    const tupleMatch = source.match(
        new RegExp(`export const ${exportName}\\s*=\\s*\\[([^\\]]+)\\]`),
    );
    if (tupleMatch) {
        return [...tupleMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    }

    throw new Error(`[${exportName}] no union type or const tuple found`);
}

/**
 * `extraLiterals` covers a vocabulary declared as `OtherType | "literal"`
 * rather than a self-contained union — `parseTsLiterals`'s regex resolves
 * only same-file string literals, so a referenced type from another file
 * (e.g. `NotificationType = NotificationKind | "digest"`) is pointed at that
 * other type's own file/export instead, with the extra literal(s) the alias
 * adds on top named explicitly here rather than silently dropped.
 */
function extractTsLiterals({ file, exportName, extraLiterals }) {
    const literals = parseTsLiterals(readSrc(file), exportName);
    return extraLiterals ? [...literals, ...extraLiterals] : literals;
}

/** Extracts every literal a firestore.rules condition compares the vocabulary's field against, given already-read source text. Pure. */
export function parseRulesLiterals(source, pattern) {
    return [...new Set([...source.matchAll(pattern)].map((m) => m[1]))];
}

function extractRulesLiterals({ file, pattern }) {
    return parseRulesLiterals(readSrc(file), pattern);
}

/** Extracts every literal value real producer code writes for the vocabulary's field, given a map of {relPath: sourceText}. Pure. */
export function parseWriterLiterals(sourcesByFile, pattern) {
    const found = new Set();
    for (const source of Object.values(sourcesByFile)) {
        for (const m of source.matchAll(pattern)) found.add(m[1]);
    }
    return [...found];
}

function extractWriterLiterals({ files, pattern }) {
    const sourcesByFile = Object.fromEntries(files.map((f) => [f, readSrc(f)]));
    return parseWriterLiterals(sourcesByFile, pattern);
}

// ─── Vocabulary configs ─────────────────────────────────────────────────────

const VOCABULARIES = [
    {
        name: "LogSource",
        mode: "enforce",
        ts: { file: "lib/logging/log-types.ts", exportName: "LOG_SOURCES" },
        // system_logs' own rules are `allow create, update, delete: if false`
        // — every write is Admin-SDK-only, so rules have no list to compare.
        rules: null,
        writers: {
            files: [
                "features/admin/services/user.service.ts",
                "features/admin/services/log.service.ts",
                "features/user/services/auth-logging.service.ts",
                "lib/logging/user-actions.ts",
            ],
            pattern: /\bsource:\s*"([a-z_]+)"/g,
        },
    },
    {
        name: "DeckAccessRole",
        mode: "enforce",
        ts: {
            file: "features/flashcard/types/flashcard.types.ts",
            exportName: "DeckAccessRole",
        },
        rules: {
            file: "firestore.rules",
            pattern: /roles\[request\.auth\.uid\]\s*==\s*'([a-z]+)'/g,
        },
        // Roles are assigned dynamically from the DeckAccessRole vocabulary
        // itself (invite UI, role-change handlers) rather than a fixed set
        // of literal-writing call sites — the TS union is the source of
        // truth here, so there's no separate writer set to compare.
        writers: null,
    },
    {
        name: "NotificationType",
        // Enforce (T-108a, Wave 5): the union now widens to every value ever
        // written. Declared as `NotificationKind | "digest"` — a type alias,
        // not a self-contained literal union — so `ts` resolves the 9
        // NotificationKind literals from their real declaration
        // (domain/events.ts) and `extraLiterals` adds the one value outside
        // that vocabulary ("digest", written directly by the Cloud Function
        // digest sweep, which bypasses NotificationKind's producer pipeline).
        mode: "enforce",
        ts: {
            file: "features/notifications/domain/events.ts",
            exportName: "NotificationKind",
            extraLiterals: ["digest"],
        },
        rules: {
            file: "firestore.rules",
            pattern: /isValidNotificationType\(t\)\s*\{\s*return t in \[([^\]]+)\]/,
            // Single match containing a comma-separated literal list, not
            // one-literal-per-match like the other rules patterns — handled
            // specially below.
            singleListMatch: true,
        },
        writers: {
            files: [
                "features/notifications/schema.ts",
                "features/admin/actions/admin.actions.ts",
                "features/flashcard/services/access.service.ts",
                "features/notifications/services/notification-pending.ts",
                // A separate Node package (own package.json/tsconfig,
                // deployed independently) — included here because it writes
                // into the same notifications vocabulary the app declares.
                "functions/src/digest.ts",
            ],
            // Two writer shapes coexist: the newer `kind` discriminated
            // union (schema.ts, admin.actions.ts, access.service.ts) and the
            // legacy `type: "..." as NotificationType` pending-invite path
            // (notification-pending.ts) — both feed values into the same
            // declared NotificationType union.
            pattern:
                /\b(?:kind:\s*(?:z\.literal\()?|type:\s*)"([a-z_]+)"(?:\s*as NotificationType)?/g,
        },
    },
];

// ─── Comparison engine ──────────────────────────────────────────────────────

export function diffSubset(literals, allowed, label) {
    return literals
        .filter((l) => !allowed.includes(l))
        .map((l) => `${label} "${l}" is not in the TS union`);
}

function checkVocabulary(config) {
    const problems = [];
    const tsLiterals = extractTsLiterals(config.ts);
    // Declared-but-unwritten union members are a real but lower-urgency and
    // out-of-scope-to-fix-here finding (CS-3's "no capability without a
    // consumer," same family as T-109b/c/d's zero-consumer schemas) — always
    // reported, never blocking, regardless of the vocabulary's own mode.
    // Otherwise wiring this check for the first time could immediately fail
    // CI on a pre-existing gap unrelated to T-115b.
    const deadValueWarnings = [];

    if (config.rules) {
        let rulesLiterals;
        if (config.rules.singleListMatch) {
            const source = readSrc(config.rules.file);
            const match = source.match(config.rules.pattern);
            rulesLiterals = match ? [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : [];
        } else {
            rulesLiterals = extractRulesLiterals(config.rules);
        }
        problems.push(...diffSubset(rulesLiterals, tsLiterals, "firestore.rules literal"));
    }

    if (config.writers) {
        const writerLiterals = extractWriterLiterals(config.writers);
        problems.push(...diffSubset(writerLiterals, tsLiterals, "writer literal"));
        const deadValues = tsLiterals.filter((v) => !writerLiterals.includes(v));
        deadValueWarnings.push(
            ...deadValues.map(
                (v) => `TS union member "${v}" has no writer in the configured file set`,
            ),
        );
    }

    return { name: config.name, mode: config.mode, tsLiterals, problems, deadValueWarnings };
}

function main() {
    const results = VOCABULARIES.map(checkVocabulary);
    let hasEnforceFailure = false;

    for (const result of results) {
        const label = `[${result.name}]`;
        if (result.problems.length === 0) {
            console.log(`${label} agrees (${result.tsLiterals.length} values) — ${result.mode}`);
        } else {
            const prefix =
                result.mode === "enforce" ? "MISMATCH" : "report-only mismatch (not blocking)";
            console.log(`${label} ${prefix}:`);
            for (const problem of result.problems) console.log(`  - ${problem}`);
            if (result.mode === "enforce") hasEnforceFailure = true;
        }

        for (const warning of result.deadValueWarnings) {
            console.log(`${label} dead value (not blocking): ${warning}`);
        }
    }

    if (hasEnforceFailure) {
        console.error("\nVocabulary agreement check failed — see MISMATCH entries above.");
        process.exit(1);
    }
    console.log(
        "\nVocabulary agreement check passed (report-only mismatches, if any, are tracked separately).",
    );
}

// Only auto-run when executed directly (`node scripts/check-vocabulary-agreement.mjs`),
// not when imported by a test for its exported pure functions.
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
