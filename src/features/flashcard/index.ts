/**
 * Flashcard Feature - Public API
 *
 * @remarks
 * Consolidated exports from core domain logic and feature modules.
 * Organized by logical grouping for better maintainability.
 */

// ── Core Domain ────────────────────────────────────────────────────────────
export * from "./core/components";
export * from "./core/hooks";
export * from "./core/services";
export * from "./core/types";
export * from "./core/utils";

// ── Feature Modules ────────────────────────────────────────────────────────
export * from "./dashboard";
export * from "./detail";

// ── Game Modes ─────────────────────────────────────────────────────────────
export * from "./games";
export * from "./games/match";
export * from "./games/speed";
export * from "./games/study";
