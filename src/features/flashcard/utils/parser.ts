import { FlashCard } from "../types";

export interface ParseResult {
    valid: Partial<FlashCard>[];
    invalid: { row: string; error: string }[];
}

export const parseCSV = async (file: File): Promise<ParseResult> => {
    const text = await file.text();
    return parseText(text);
};

export const parseText = (text: string): ParseResult => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const valid: Partial<FlashCard>[] = [];
    const invalid: { row: string; error: string }[] = [];

    lines.forEach((line) => {
        const separator = line.includes("\t") ? "\t" : ",";

        const parts = line.split(separator).map((p) => p.trim());

        if (parts.length >= 3) {
            valid.push({
                kanji: parts[0],
                furigana: parts[1],
                meaning: parts[2],
                example: parts[3] || "",
            });
        } else if (parts.length === 2) {
            valid.push({
                kanji: parts[0],
                furigana: "",
                meaning: parts[1],
                example: "",
            });
        } else {
            invalid.push({
                row: line,
                error: "Requires at least 2 columns (Kanji/Word, Meaning)",
            });
        }
    });

    return { valid, invalid };
};
