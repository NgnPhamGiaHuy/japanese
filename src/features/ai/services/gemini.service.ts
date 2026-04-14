import { getGenerativeModel } from "firebase/ai";

import { firebaseAI } from "@/lib/firebase";
import { getCardGenerationPrompt, getDeckGenerationPrompt } from "./prompt-builder";
import { AI_CONFIG } from "../config";

import type { GeneratedCard, JLPTLevel } from "../types";

export type { GeneratedCard, JLPTLevel } from "../types";

export class AIServiceError extends Error {
    constructor(
        message: string,
        public readonly code: "parse_error" | "api_error" | "quota_error" | "invalid_response",
    ) {
        super(message);
        this.name = "AIServiceError";
    }
}

const cardCache = new Map<string, GeneratedCard>();
const deckCache = new Map<string, GeneratedCard[]>();

function normalizeToken(value: string): string {
    return value.trim().toLocaleLowerCase();
}

function cardDedupKeys(card: GeneratedCard): string[] {
    const keys = [card.kanji, card.furigana]
        .map((value) => normalizeToken(value))
        .filter((value) => value.length > 0);
    return Array.from(new Set(keys));
}

function dedupeDeckCards(cards: GeneratedCard[], existingWords: string[]): GeneratedCard[] {
    const blocked = new Set(existingWords.map((word) => normalizeToken(word)).filter(Boolean));
    const seen = new Set<string>();
    const filtered: GeneratedCard[] = [];

    for (const card of cards) {
        const keys = cardDedupKeys(card);
        const collides = keys.some((key) => blocked.has(key) || seen.has(key));
        if (collides) continue;
        keys.forEach((key) => seen.add(key));
        filtered.push(card);
    }

    return filtered;
}

function getModel(modelName: string) {
    return getGenerativeModel(firebaseAI, {
        model: modelName,
        generationConfig: {
            responseMimeType: AI_CONFIG.generation.responseMimeType,
            temperature: AI_CONFIG.generation.temperature,
            topP: AI_CONFIG.generation.topP,
            maxOutputTokens: AI_CONFIG.generation.maxOutputTokens,
        },
    });
}

function parseCard(raw: unknown): GeneratedCard {
    if (typeof raw !== "object" || raw === null) {
        throw new AIServiceError("AI returned an unexpected shape", "invalid_response");
    }
    const obj = raw as Record<string, unknown>;

    const kanji = String(obj.kanji ?? "").trim();
    const furigana = String(obj.furigana ?? "").trim();
    const meaning = String(obj.meaning ?? "").trim();
    const example = String(obj.example ?? "").trim();

    if (!kanji || !meaning) {
        throw new AIServiceError(
            "AI response is missing required fields (kanji, meaning)",
            "invalid_response",
        );
    }

    const distractors = Array.isArray(obj.distractors)
        ? obj.distractors
              .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
              .map((d) => d.trim())
              .slice(0, 3)
        : undefined;

    const hint =
        typeof obj.hint === "string" && obj.hint.trim().length > 0
            ? obj.hint.trim().slice(0, 120)
            : undefined;

    const usageNote =
        typeof obj.usageNote === "string" && obj.usageNote.trim().length > 0
            ? obj.usageNote.trim().slice(0, 120)
            : undefined;

    const rawDiff = Number(obj.difficulty);
    const difficulty: 1 | 2 | 3 | undefined = [1, 2, 3].includes(rawDiff)
        ? (rawDiff as 1 | 2 | 3)
        : undefined;

    return { kanji, furigana, meaning, example, distractors, hint, usageNote, difficulty };
}

function parseCardArray(raw: unknown): GeneratedCard[] {
    if (!Array.isArray(raw)) {
        throw new AIServiceError("AI response is not an array", "invalid_response");
    }
    return raw.map((item, i) => {
        try {
            return parseCard(item);
        } catch {
            throw new AIServiceError(`Card at index ${i} has invalid shape`, "invalid_response");
        }
    });
}

function classifyError(err: unknown): never {
    if (err instanceof AIServiceError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("quota") || msg.includes("429")) {
        throw new AIServiceError("AI quota exceeded — please try again later", "quota_error");
    }
    if (msg.includes("JSON") || msg.includes("parse")) {
        throw new AIServiceError("AI returned malformed data — try rephrasing", "parse_error");
    }
    throw new AIServiceError(`AI request failed: ${msg}`, "api_error");
}

export const generateCardData = async (word: string): Promise<GeneratedCard> => {
    const trimmed = word.trim();
    if (!trimmed) throw new AIServiceError("Word cannot be empty", "api_error");

    const cacheKey = trimmed.toLowerCase();
    const cached = cardCache.get(cacheKey);
    if (cached) return cached;

    try {
        const model = getModel(AI_CONFIG.models.card);
        const result = await model.generateContent(getCardGenerationPrompt(trimmed));
        const card = parseCard(JSON.parse(result.response.text()));
        cardCache.set(cacheKey, card);
        return card;
    } catch (err) {
        classifyError(err);
    }
};

export const generateDeck = async (
    topic: string,
    count: number,
    level: JLPTLevel,
    existingWords: string[] = [],
): Promise<GeneratedCard[]> => {
    const trimmed = topic.trim();
    if (!trimmed) throw new AIServiceError("Topic cannot be empty", "api_error");

    const safeCnt = Math.min(
        Math.max(count, AI_CONFIG.limits.minDeckCards),
        AI_CONFIG.limits.maxDeckCards,
    );
    const normalizedExclusions = Array.from(
        new Set(existingWords.map((word) => normalizeToken(word)).filter(Boolean)),
    ).sort();
    const cacheKey = `${trimmed.toLowerCase()}::${safeCnt}::${level}::${normalizedExclusions.join("|")}`;
    const cached = deckCache.get(cacheKey);
    if (cached) return cached;

    try {
        const model = getModel(AI_CONFIG.models.deck);
        const result = await model.generateContent(
            getDeckGenerationPrompt(trimmed, safeCnt, level, normalizedExclusions),
        );
        const cards = parseCardArray(JSON.parse(result.response.text()));
        const deduped = dedupeDeckCards(cards, normalizedExclusions);
        deckCache.set(cacheKey, deduped);
        return deduped;
    } catch (err) {
        classifyError(err);
    }
};
