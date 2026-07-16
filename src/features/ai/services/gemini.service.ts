import { getGenerativeModel } from "firebase/ai";

import { firebaseAI } from "@/lib/firebase";
import { generatedCardArraySchema, generatedCardSchema } from "@/shared/schemas";
import { splitAtomicPrimary, validateAtomicCard } from "@/shared/utils";
import { getCardGenerationPrompt, getDeckGenerationPrompt } from "./prompt-builder";
import { AI_CONFIG } from "../config";
import { getMatchDistractorsPrompt } from "../prompts/match.distractors";

import type { GeneratedCard, JLPTLevel } from "../types";

/** Minimal card shape this service needs — avoids depending on flashcard's full FlashCard type. */
interface DistractorSourceCard {
    primary: string;
    alternatives?: string[];
    meaning: string;
}

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

// ─── Firebase AI Logic (sole path) ────────────────────────────────────────────
//
// All Gemini calls are proxied through Firebase AI Logic — no API key is ever
// present in client code or the client bundle. App Check (once enabled, see
// the App Check hardening work) attests the caller to Firebase before the
// request is forwarded to the Gemini provider.
//
// A prior direct-REST path with a client-exposed API key existed here and
// has been removed entirely — do not reintroduce a client-side Gemini key
// (any env var prefixed NEXT_PUBLIC_ is inlined into the browser bundle).

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

async function callFirebaseAI(modelName: string, prompt: string): Promise<string> {
    const model = getFirebaseModel(modelName);
    const result = await model.generateContent(prompt);
    return result.response.text();
}

async function fileToBase64(file: File): Promise<{ mimeType: string; data: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const data = result.split(",")[1];
            resolve({ mimeType: file.type, data });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/** Generates content via Firebase AI Logic — see the module header for why. */
async function generateContent(modelName: string, prompt: string): Promise<string> {
    return callFirebaseAI(modelName, prompt);
}

async function generateMultimodalContent(
    modelName: string,
    prompt: string,
    files: File[],
): Promise<string> {
    const base64Files = await Promise.all(files.map(fileToBase64));
    const model = getFirebaseModel(modelName);
    const parts = [
        prompt,
        ...base64Files.map((f) => ({
            inlineData: { mimeType: f.mimeType, data: f.data },
        })),
    ];
    const result = await model.generateContent(parts);
    return result.response.text();
}

/** Parses raw (untrusted) Gemini JSON into a GeneratedCard — see ai-output.schema.ts. */
function parseCard(raw: unknown): GeneratedCard {
    const result = generatedCardSchema.safeParse(raw);
    if (!result.success) {
        const message = result.error.issues[0]?.message ?? "AI returned an unexpected shape";
        throw new AIServiceError(message, "invalid_response");
    }
    return result.data;
}

function parseCardArray(raw: unknown): GeneratedCard[] {
    if (!Array.isArray(raw)) {
        throw new AIServiceError("AI response is not an array", "invalid_response");
    }
    const result = generatedCardArraySchema.safeParse(raw);
    if (!result.success) {
        const issue = result.error.issues[0];
        const index = issue?.path[0];
        throw new AIServiceError(
            typeof index === "number"
                ? `Card at index ${index} has invalid shape`
                : "AI response contains an invalid card",
            "invalid_response",
        );
    }
    return result.data;
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

/**
 * Decoy tiles: visually/semantically similar to pool content; deduped against targets.
 * Strictly separates Japanese and English to prevent mixed-language tiles.
 */
export const generateMatchDistractors = async (
    cards: DistractorSourceCard[],
    count: number,
): Promise<string[]> => {
    const safeCount = Math.min(Math.max(count, 1), 24);
    const clean = (s: string) => s.split(/[/(,]/)[0].trim();
    const nl = (s: string) => s.trim().toLowerCase();

    // 1. Precise board representation (match exactly what is on the grid)
    const existingTiles = Array.from(
        new Set(
            cards.flatMap((c) => [clean(c.primary), clean(c.meaning)]).filter((s) => s.length > 0),
        ),
    );

    // 2. Semantic blocklist for final validation
    const semanticBlocklist = new Set<string>();
    cards.forEach((c) => {
        [c.primary, ...(c.alternatives || []), c.meaning].forEach((val) => {
            if (!val) return;
            semanticBlocklist.add(nl(val));
            semanticBlocklist.add(nl(clean(val)));
        });
    });

    const prompt = getMatchDistractorsPrompt(existingTiles, safeCount);

    const fallbacksJapanese = [
        "シート",
        "ツール",
        "ぬいぐるみ",
        "めがね",
        "あさ",
        "ばん",
        "みず",
        "おちゃ",
        "ほん",
        "ぺん",
        "いえ",
        "くるま",
    ];
    const fallbacksEnglish = [
        "Table",
        "Chair",
        "Phone",
        "Watch",
        "Tree",
        "Road",
        "Sky",
        "Cloud",
        "Apple",
        "Bread",
        "City",
        "Home",
    ];

    let rawList: string[] = [];
    try {
        const text = await generateContent(AI_CONFIG.models.card, prompt);
        const raw = JSON.parse(extractJSON(text)) as { distractors?: unknown };
        const list = Array.isArray(raw.distractors) ? raw.distractors : [];
        rawList = list
            .filter((d): d is string => typeof d === "string" && d.length > 0)
            .map((d) => clean(d));
    } catch {
        rawList = [];
    }

    const out: string[] = [];
    const taken = new Set(semanticBlocklist);

    // 3. Post-process AI results with strict semantic filtering
    const candidatePool = [...rawList, ...fallbacksEnglish, ...fallbacksJapanese];

    for (const candidate of candidatePool) {
        if (out.length >= safeCount) break;
        const normalized = nl(candidate);

        // Strict duplication check
        let isDuplicate = taken.has(normalized);
        if (!isDuplicate) {
            // Check for partial collisions (e.g. "Sorry" vs "I'm sorry")
            for (const blocked of taken) {
                if (
                    blocked.length > 3 &&
                    (blocked.includes(normalized) || normalized.includes(blocked))
                ) {
                    isDuplicate = true;
                    break;
                }
            }
        }

        if (!isDuplicate) {
            taken.add(normalized);
            out.push(candidate);
        }
    }

    // 4. Absolute emergency fallback
    while (out.length < safeCount) {
        const fallback = `Item ${out.length + 1}`;
        out.push(fallback);
    }

    return out;
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
        const rawCards = parseCardArray(JSON.parse(extractJSON(text)));

        // 1. Split non-atomic cards
        const splitCards: GeneratedCard[] = [];
        for (const card of rawCards) {
            const validation = validateAtomicCard(card);
            if (!validation.valid) {
                const atomicPrimaries = splitAtomicPrimary(card.primary);
                splitCards.push(
                    ...(atomicPrimaries.length > 0
                        ? atomicPrimaries.map((p) => ({ ...card, primary: p }))
                        : [card]),
                );
            } else splitCards.push(card);
        }

        // 2. Deduplicate against existing and within the new set
        const atomicCards = dedupeDeckCards(splitCards, normalizedExclusions);

        deckCache.set(cacheKey, atomicCards);
        return atomicCards;
    } catch (err) {
        classifyError(err);
    }
};

export const generateDeckFromImages = async (
    files: File[],
    context?: { userLevel?: string },
    existingWords: string[] = [],
): Promise<{ title: string; description: string; cards: GeneratedCard[] }> => {
    if (files.length === 0) throw new AIServiceError("No images provided", "api_error");

    const { getDeckFromImagesPrompt } = await import("./prompt-builder");
    const prompt = getDeckFromImagesPrompt(context);

    try {
        const text = await generateMultimodalContent(AI_CONFIG.models.deck, prompt, files);
        const data = JSON.parse(extractJSON(text));

        const title = data.title || "Image Discovery Deck";
        const description = data.description || "Generated from uploaded images";
        const rawCards = parseCardArray(data.cards || []);

        const normalizedExclusions = Array.from(
            new Set(existingWords.map((word) => normalizeToken(word)).filter(Boolean)),
        );

        // 1. Split non-atomic cards
        const splitCards: GeneratedCard[] = [];
        for (const card of rawCards) {
            const validation = validateAtomicCard(card);
            if (!validation.valid) {
                const atomicPrimaries = splitAtomicPrimary(card.primary);
                splitCards.push(
                    ...(atomicPrimaries.length > 0
                        ? atomicPrimaries.map((p) => ({ ...card, primary: p }))
                        : [card]),
                );
            } else splitCards.push(card);
        }

        // 2. Deduplicate
        const atomicCards = dedupeDeckCards(splitCards, normalizedExclusions);

        return { title, description, cards: atomicCards };
    } catch (err) {
        classifyError(err);
    }
};
