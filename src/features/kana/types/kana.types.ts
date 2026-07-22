export type AlphabetMode = "hiragana" | "katakana" | "both";
export type QuestionType = "read" | "type";

export interface KanaChar {
    char: string;
    romaji: string;
    group: string;
}
