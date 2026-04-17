/**
 * @file Match Feature — Public API
 *
 * @remarks
 * Single entry point for Match game feature.
 * Enforces encapsulation — only exports what's needed externally.
 */

// ── Public Components ──────────────────────────────────────────────────────
export { MatchGame } from "./components";

// ── Public Hooks (if needed by other features) ────────────────────────────
// Currently none — all hooks are internal to the feature
export * from "./hooks";

// ── Public Types (if needed) ───────────────────────────────────────────────
// Currently none — types are internal or imported from shared locations
