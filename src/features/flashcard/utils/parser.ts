import { FlashCard } from "../types";

/**
 * Result object for the flashcard ingestion process.
 */
export interface ParseResult {
    /** Successfully mapped card fragments */
    valid: Partial<FlashCard>[];
    /** Rows that failed to meet the minimum schema requirements */
    invalid: {
        /** The raw text of the failing row */
        row: string;
        /** Semantic reason for the failure */
        error: string;
    }[];
}

/**
 * Async wrapper for parsing browser-level File objects.
 */
export async function parseCSV(file: File): Promise<ParseResult> {
    const text = await file.text();
    return parseText(text);
}

/**
 * Core transformation engine for raw text ingestion.
 *
 * @remarks
 * Logic orchestration:
 * 1. **Separator Heuristic**: Dynamically detects Tab (\t) vs Comma (,) to support
 *    both standard CSVs and Anki-style TSV exports.
 * 2. **Flexible Mapping**:
 *    - **2 Columns**: [Word, Meaning] -> (assumes empty Furigana/Example).
 *    - **3 Columns**: [Word, Furigana, Meaning].
 *    - **4 Columns**: [Word, Furigana, Meaning, Example].
 * 3. **Sanitization**: Trims all whitespace and ignores empty lines to prevent data pollution.
 *
 * @param text - Raw multi-line string content.
 * @returns Partitioned valid and invalid results for UI feedback.
 */
export function parseText(text: string): ParseResult {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const valid: Partial<FlashCard>[] = [];
    const invalid: { row: string; error: string }[] = [];

    lines.forEach((line) => {
        // Simple heuristic: Tabs usually signify Anki/TSV format, otherwise fall back to CSV
        const separator = line.includes("\t") ? "\t" : ",";
        const parts = line.split(separator).map((p) => p.trim());

        if (parts.length >= 3) {
            const kana = parts[1] || parts[0];
            valid.push({
                kanaPrimary: kana,
                altForm: parts[0] !== kana ? parts[0] : undefined,
                furigana: parts[1],
                meaning: parts[2],
                example: parts[3] || "",
            });
        } else if (parts.length === 2) {
            valid.push({
                kanaPrimary: parts[0],
                meaning: parts[1],
                example: "",
            });
        } else {
            invalid.push({
                row: line,
                error: "Requires at least 2 columns (Word/Kanji, Meaning)",
            });
        }
    });

    return { valid, invalid };
}
