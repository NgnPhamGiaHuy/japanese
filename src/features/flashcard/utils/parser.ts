import { validateAtomicCard } from "./card.validator";
import { splitAlternatives } from "./formatting";
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
 * Parses content (JSON or CSV/TSV) into flashcard fragments.
 * Handles both structured JSON arrays/objects and flat CSV text.
 */
export function parseText(text: string): ParseResult {
    const trimmed = text.trim();

    // 1. Try JSON parsing if it looks like JSON
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
            const data = JSON.parse(trimmed);
            const rawCards = Array.isArray(data) ? data : data.cards || [];
            if (Array.isArray(rawCards)) {
                return {
                    valid: rawCards.map((c: any) => ({
                        primary: c.primary || "",
                        alternatives: Array.isArray(c.alternatives) ? c.alternatives : [],
                        meaning: c.meaning || "",
                        example: c.example || "",
                    })),
                    invalid: [],
                };
            }
        } catch {
            // Fall back to CSV if JSON fails
        }
    }

    // 2. CSV/TSV Logic (fallback)
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const valid: (Partial<FlashCard> & { atomicViolation?: boolean })[] = [];
    const invalid: { row: string; error: string }[] = [];

    lines.forEach((line) => {
        // Detect primary separator using frequency-based heuristics to avoid sentence hyphen collisions
        const candidates = [
            { sep: "\t", count: (line.match(/\t/g) || []).length },
            { sep: ",", count: (line.match(/,/g) || []).length },
            { sep: " | ", count: (line.match(/ \| /g) || []).length },
            { sep: " : ", count: (line.match(/ : /g) || []).length },
            { sep: " - ", count: (line.match(/ - /g) || []).length },
        ];
        const best = candidates.reduce((a, b) => (b.count > a.count ? b : a), {
            sep: ",",
            count: 0,
        });
        const separator = best.count > 0 ? best.sep : ",";

        let parts: string[] = [];
        // Robust split: use split() for simple cases, only regex for complex quoted CSV
        if (separator.length === 1 && !line.includes('"')) {
            parts = line.split(separator).map((p) => p.trim());
        } else if (separator.length > 1) {
            parts = line.split(separator).map((p) => p.trim());
        } else {
            // Complex CSV logic
            const regex = new RegExp(
                `\\s*("(?:[^"]|"")*"|[^${separator}]*)\\s*(?:${separator}|$)`,
                "g",
            );
            let lastPos = 0;
            let match;
            while ((match = regex.exec(line)) !== null) {
                let part = match[1] || "";
                if (part.startsWith('"') && part.endsWith('"')) {
                    part = part.slice(1, -1).replace(/""/g, '"');
                }
                parts.push(part.trim());
                lastPos = regex.lastIndex;
                if (match.index === regex.lastIndex) regex.lastIndex++;
            }
            // Check for trailing separator
            if (line.endsWith(separator)) {
                parts.push("");
            }
        }

        // Filter out the very last part if it's empty (trailing separator artifact),
        // but keep empty parts in the middle as they represent columns.
        if (parts.length > 1 && parts[parts.length - 1] === "" && !line.endsWith(separator)) {
            parts.pop();
        }

        const primary = parts[0];
        if (!primary) {
            invalid.push({
                row: line,
                error: "Primary expression (Column 1) is required",
            });
            return;
        }

        const hasJapanese = (text: string) =>
            /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf]/.test(text);

        let finalPrimary = primary;
        let finalAlternatives: string[] = [];
        let finalMeaning = "";
        let finalExample = "";

        if (parts.length === 2) {
            // [Primary, Meaning]
            finalMeaning = parts[1];
        } else if (parts.length === 3) {
            // Heuristic for 3 columns:
            // If col 2 is Japanese and col 3 is not, it's likely [P, Alternative, Meaning]
            // If col 2 is not Japanese and col 3 is Japanese (or anything else), it's likely [P, Meaning, Example]
            if (hasJapanese(parts[1]) && !hasJapanese(parts[2])) {
                finalAlternatives = splitAlternatives(parts[1]);
                finalMeaning = parts[2];
            } else {
                finalMeaning = parts[1];
                finalExample = parts[2];
            }
        } else if (parts.length >= 4) {
            // [Primary, Alternative, Meaning, Example...]
            finalAlternatives = splitAlternatives(parts[1]);
            finalMeaning = parts[2];
            // If there are extra columns (e.g. commas in the example sentence), join them back
            finalExample = parts.slice(3).join(separator);
        }

        const card: Partial<FlashCard> & { atomicViolation?: boolean } = {
            primary: finalPrimary,
            alternatives: finalAlternatives,
            meaning: finalMeaning,
            example: finalExample,
        };

        const atomicResult = validateAtomicCard({ primary: finalPrimary });
        if (!atomicResult.valid) card.atomicViolation = true;

        if (!card.meaning) {
            invalid.push({ row: line, error: "Meaning (definition) is required" });
        } else {
            valid.push(card);
        }
    });

    return { valid, invalid };
}
