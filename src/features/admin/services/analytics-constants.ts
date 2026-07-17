/**
 * @file analytics-constants
 * Constants shared between the aggregate analytics chart data
 * (analytics.service.ts's getAdminAnalytics) and the per-feature drilldown
 * (analytics-drilldowns.ts's getFeatureUsageDetails) — split out as part of
 * E11-T3. Data only, not logic: the two consumers' actual discovery-pool
 * building and filtering differ (one dedupes across 2 collections, the
 * other scans 3 with source-prefixed IDs and no dedup) and were NOT
 * unified — see each file's header for why forcing them into one shared
 * function would have been an unverified behavior change, not a pure split.
 */
export const DISCOVERY_LIMIT = 1000;

export const FEATURE_ALIASES: Record<string, string[]> = {
    flashcards: ["flashcard", "deck", "lesson", "content", "study"],
    kana: ["kana", "hiragana", "katakana", "survival", "quiz"],
    matching: ["match", "session", "matching"],
};
