import { FlashCard } from "../types";

export interface ParseResult {
    valid: Partial<FlashCard>[];
    invalid: {
        row: string;
        error: string;
    }[];
}

export async function parseCSV(file: File): Promise<ParseResult> {
    const text = await file.text();
    return parseText(text);
}

/**
 * Parses CSV/TSV text into flashcard fragments.
 *
 * Expected column formats:
 *   2 columns: kanaPrimary, meaning
 *   3 columns: kanaPrimary, altForm, meaning
 *   4 columns: kanaPrimary, altForm, meaning, example
 *
 * kanaPrimary (column 1) is REQUIRED and must be non-empty.
 * Rows missing kanaPrimary are marked invalid.
 */
export function parseText(text: string): ParseResult {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const valid: Partial<FlashCard>[] = [];
    const invalid: { row: string; error: string }[] = [];

    lines.forEach((line) => {
        const separator = line.includes("\t") ? "\t" : ",";
        const parts = line.split(separator).map((p) => p.trim());

        const kanaPrimary = parts[0];

        if (!kanaPrimary) {
            invalid.push({ row: line, error: "kanaPrimary (column 1) is required and cannot be empty" });
            return;
        }

        if (parts.length >= 3) {
            const altForm = parts[1] && parts[1] !== kanaPrimary ? parts[1] : undefined;
            valid.push({
                kanaPrimary,
                altForm,
                meaning: parts[2],
                example: parts[3] || "",
            });
        } else if (parts.length === 2) {
            valid.push({
                kanaPrimary,
                meaning: parts[1],
                example: "",
            });
        } else {
            invalid.push({ row: line, error: "Requires at least 2 columns (kanaPrimary, meaning)" });
        }
    });

    return { valid, invalid };
}
