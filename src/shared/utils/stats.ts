const STORAGE_KEY = "hm_char_stats";

interface CharStat {
    correct: number;
    attempts: number;
}

/** Records a correct/incorrect answer for a given kana character in localStorage */
export function recordCharStat(char: string, isCorrect: boolean): void {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const stats: Record<string, CharStat> = raw ? JSON.parse(raw) : {};
        if (!stats[char]) stats[char] = { correct: 0, attempts: 0 };
        stats[char].attempts += 1;
        if (isCorrect) stats[char].correct += 1;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
        // localStorage may be unavailable (SSR, private mode)
    }
}

/** Returns the raw char stats map from localStorage */
export function getCharStats(): Record<string, CharStat> {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    } catch {
        return {};
    }
}

/** Resets all character statistics */
export function clearCharStats(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {}
}
