import { validateAtomicCard } from "./card.validator";
import { FlashCard } from "../types";

export interface ParseResult {
    valid: (Partial<FlashCard> & { atomicViolation?: boolean })[];
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
 *   2 columns: primary, meaning
 *   3 columns: primary, secondaryRepresentation, meaning
 *   4 columns: primary, secondaryRepresentation, meaning, example
 *
 * primary (column 1) is REQUIRED and must be non-empty.
 */
export function parseText(text: string): ParseResult {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const valid: Partial<FlashCard>[] = [];
    const invalid: { row: string; error: string }[] = [];

    lines.forEach((line) => {
        const separator = line.includes("\t") ? "\t" : ",";
        const parts = line.split(separator).map((p) => p.trim());

        const primary = parts[0];

        if (!primary) {
            invalid.push({
                row: line,
                error: "primary (column 1) is required and cannot be empty",
            });
            return;
        }

        if (parts.length >= 3) {
            const secondary = parts[1] && parts[1] !== primary ? parts[1] : undefined;
            const atomicResult = validateAtomicCard({ primary });
            valid.push({
                primary,
                alternatives: secondary ? [secondary] : [],
                meaning: parts[2],
                example: parts[3] || "",
                ...(atomicResult.valid ? {} : { atomicViolation: true }),
            });
        } else if (parts.length === 2) {
            const atomicResult = validateAtomicCard({ primary });
            valid.push({
                primary,
                alternatives: [],
                meaning: parts[1],
                example: "",
                ...(atomicResult.valid ? {} : { atomicViolation: true }),
            });
        } else {
            invalid.push({ row: line, error: "Requires at least 2 columns (primary, meaning)" });
        }
    });

    return { valid, invalid };
}
