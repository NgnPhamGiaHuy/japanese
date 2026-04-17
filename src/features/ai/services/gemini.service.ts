import { getGenerativeModel } from "firebase/ai";

import {
    splitAtomicPrimary,
    validateAtomicCard,
} from "@/features/flashcard/core/utils/card.validator";
import { firebaseAI } from "@/lib/firebase";
import { getCardGenerationPrompt, getDeckGenerationPrompt } from "./prompt-builder";
import { AI_CONFIG } from "../config";
import { getMatchDistractorsPrompt } from "../prompts/match.distractors";

import type { FlashCard } from "@/features/flashcard/core/types";
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
    const keys = [card.primary, ...(card.alternatives || [])]
        .map((value) => normalizeToken(value ?? ""))
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

// ─── Direct Gemini API (primary) ──────────────────────────────────────────────

const DIRECT_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Calls the Gemini REST API directly using the user-supplied API key.
 * Returns the raw text response.
 */
async function callGeminiDirect(modelName: string, prompt: string): Promise<string> {
    const url = `${GEMINI_BASE}/${modelName}:generateContent?key=${DIRECT_API_KEY}`;
    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: AI_CONFIG.generation.temperature,
            topP: AI_CONFIG.generation.topP,
            maxOutputTokens: AI_CONFIG.generation.maxOutputTokens,
        },
    };

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        if (res.status === 429)
            throw new AIServiceError("AI quota exceeded — please try again later", "quota_error");
        throw new AIServiceError(`Gemini API error ${res.status}: ${errText}`, "api_error");
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) throw new AIServiceError("Gemini API returned empty response", "api_error");
    return text;
}

// ─── Firebase AI fallback ─────────────────────────────────────────────────────

function getFirebaseModel(modelName: string) {
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

async function callFirebaseFallback(modelName: string, prompt: string): Promise<string> {
    const model = getFirebaseModel(modelName);
    const result = await model.generateContent(prompt);
    return result.response.text();
}

/**
 * Generates content using the direct API key first.
 * Falls back to Firebase AI if the key is not configured or the direct call fails.
 */
async function generateContent(modelName: string, prompt: string): Promise<string> {
    if (DIRECT_API_KEY) {
        try {
            return await callGeminiDirect(modelName, prompt);
        } catch (err) {
            // Re-throw quota errors — no point falling back
            if (err instanceof AIServiceError && err.code === "quota_error") throw err;
            console.warn("[AI] Direct API failed, falling back to Firebase AI:", err);
        }
    }
    return callFirebaseFallback(modelName, prompt);
}

function parseCard(raw: unknown): GeneratedCard {
    if (typeof raw !== "object" || raw === null) {
        throw new AIServiceError("AI returned an unexpected shape", "invalid_response");
    }
    const obj = raw as Record<string, unknown>;

    const primary = String(obj.primary ?? "").trim();
    const alternatives = Array.isArray(obj.alternatives)
        ? obj.alternatives
              .filter(
                  (value): value is string => typeof value === "string" && value.trim().length > 0,
              )
              .map((value) => value.trim())
        : [];
    const meaning = String(obj.meaning ?? "").trim();
    const example = String(obj.example ?? "").trim();

    if (!primary) {
        throw new AIServiceError("AI response missing required field: primary", "invalid_response");
    }

    if (!meaning) {
        throw new AIServiceError("AI response missing required field: meaning", "invalid_response");
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

    const mnemonic =
        typeof obj.mnemonic === "string" && obj.mnemonic.trim().length > 0
            ? obj.mnemonic.trim().slice(0, 120)
            : undefined;

    // clozeTemplate must contain exactly one ___ token
    const rawCloze =
        typeof obj.clozeTemplate === "string" && obj.clozeTemplate.trim().length > 0
            ? obj.clozeTemplate.trim()
            : undefined;
    const clozeTokenCount = rawCloze ? (rawCloze.match(/___/g) ?? []).length : 0;
    const clozeTemplate = clozeTokenCount === 1 ? rawCloze : undefined;

    return {
        primary,
        alternatives,
        meaning,
        example,
        distractors,
        hint,
        usageNote,
        difficulty,
        mnemonic,
        clozeTemplate,
    };
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

/**
 * Strips markdown code fences and extracts raw JSON from AI responses.
 * Handles patterns like:
 *   ```json\n{...}\n```
 *   ```\n{...}\n```
 *   plain JSON
 */
function extractJSON(raw: string): string {
    const trimmed = raw.trim();
    // Strip ```json ... ``` or ``` ... ``` wrappers
    const fenceMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/);
    if (fenceMatch) return fenceMatch[1].trim();
    return trimmed;
}

export const generateCardData = async (word: string): Promise<GeneratedCard> => {
    const trimmed = word.trim();
    if (!trimmed) throw new AIServiceError("Word cannot be empty", "api_error");

    const cacheKey = trimmed.toLowerCase();
    const cached = cardCache.get(cacheKey);
    if (cached) return cached;

    try {
        const text = await generateContent(AI_CONFIG.models.card, getCardGenerationPrompt(trimmed));
        const card = parseCard(JSON.parse(extractJSON(text)));

        // Validate atomic card principle; if violated, split and return first atomic card
        const validation = validateAtomicCard(card);
        if (!validation.valid) {
            const atomicPrimaries = splitAtomicPrimary(card.primary);
            if (atomicPrimaries.length > 0) {
                const atomicCard: GeneratedCard = { ...card, primary: atomicPrimaries[0] };
                cardCache.set(cacheKey, atomicCard);
                return atomicCard;
            }
        }

        cardCache.set(cacheKey, card);
        return card;
    } catch (err) {
        classifyError(err);
    }
};

const normLabel = (s: string) => s.trim().toLowerCase();

function blocklistFromCards(cards: FlashCard[]): Set<string> {
    const b = new Set<string>();
    for (const c of cards) {
        b.add(normLabel(c.primary));
        b.add(normLabel(c.meaning));
        for (const a of c.alternatives || []) {
            if (a?.trim()) b.add(normLabel(a));
        }
    }
    return b;
}

/**
 * Decoy tiles: visually/semantically similar to pool content; deduped against targets.
 * Strictly separates Japanese and English to prevent mixed-language tiles.
 */
export const generateMatchDistractors = async (
    cards: FlashCard[],
    count: number,
): Promise<string[]> => {
    const safeCount = Math.min(Math.max(count, 1), 12); // Slightly higher internal limit
    const blocklist = blocklistFromCards(cards);

    // Separate Japanese and English to teach the AI the "atomic" tile principle
    const targetJapanese = Array.from(
        new Set(cards.flatMap((c) => [c.primary, ...(c.alternatives || [])]).filter(Boolean)),
    ).join(", ");
    const targetEnglish = Array.from(new Set(cards.map((c) => c.meaning).filter(Boolean))).join(
        ", ",
    );

    const prompt = getMatchDistractorsPrompt(targetJapanese, targetEnglish, safeCount);

    const fallbacks = ["シート", "ツール", "ぬいぐるみ", "めがね", "かう", "うる", "あさ", "ばん"];
    const lessonMeanings = cards
        .slice(1)
        .map((c) => c.meaning)
        .filter((m): m is string => typeof m === "string" && m.trim().length > 0)
        .map((m) => m.trim());

    let rawList: string[] = [];
    try {
        const text = await generateContent(AI_CONFIG.models.card, prompt);
        const raw = JSON.parse(extractJSON(text)) as { distractors?: unknown };
        const list = Array.isArray(raw.distractors) ? raw.distractors : [];
        rawList = list
            .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
            .map((d) => d.trim().split(" / ")[0]); // Safety: strip any slashes the AI might have still included
    } catch {
        rawList = lessonMeanings.length >= 3 ? lessonMeanings : [];
    }

    const out: string[] = [];
    let fb = 0;
    const taken = new Set(blocklist);

    for (let i = 0; i < safeCount; i++) {
        const candidate =
            rawList[i] ??
            lessonMeanings.find((m) => !taken.has(normLabel(m))) ??
            fallbacks[fb % fallbacks.length];
        fb++;
        let resolved = candidate;
        let guard = 0;
        while (guard < 40 && taken.has(normLabel(resolved))) {
            resolved = `${fallbacks[fb % fallbacks.length]}${guard}`;
            fb++;
            guard++;
        }
        if (taken.has(normLabel(resolved))) resolved = `·${i + 1}`;
        taken.add(normLabel(resolved));
        out.push(resolved);
    }

    return out.slice(0, safeCount);
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
        const text = await generateContent(
            AI_CONFIG.models.deck,
            getDeckGenerationPrompt(trimmed, safeCnt, level, normalizedExclusions),
        );
        const cards = parseCardArray(JSON.parse(extractJSON(text)));
        const deduped = dedupeDeckCards(cards, normalizedExclusions);

        // Validate atomic card principle; split any non-atomic cards into multiple cards
        const atomicCards: GeneratedCard[] = [];
        for (const card of deduped) {
            const validation = validateAtomicCard(card);
            if (!validation.valid) {
                const atomicPrimaries = splitAtomicPrimary(card.primary);
                if (atomicPrimaries.length > 0) {
                    for (const primary of atomicPrimaries) {
                        atomicCards.push({ ...card, primary });
                    }
                } else {
                    atomicCards.push(card);
                }
            } else {
                atomicCards.push(card);
            }
        }

        deckCache.set(cacheKey, atomicCards);
        return atomicCards;
    } catch (err) {
        classifyError(err);
    }
};
