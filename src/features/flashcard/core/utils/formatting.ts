/**
 * Centralized formatting logic for flashcard data ingestion and editing.
 * This ensures a single source of truth for how multi-form fields (like alternatives)
 * are split when parsed and joined when displayed.
 */

export const ALTERNATIVE_SEPARATOR = " / ";
export const COLUMN_SEPARATOR = ",";

/**
 * Normalizes and splits a string of alternatives into an array.
 * Supports both forward slashes and commas as sub-separators.
 */
export const splitAlternatives = (text: string | undefined): string[] => {
    if (!text) return [];
    // Split on slash or comma with optional whitespace
    return text
        .split(/[/,]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
};

/**
 * Joins an array of alternatives into a single display string.
 */
export const joinAlternatives = (alternatives: string[] | undefined): string => {
    if (!alternatives || !Array.isArray(alternatives)) return "";
    return alternatives.join(ALTERNATIVE_SEPARATOR);
};
