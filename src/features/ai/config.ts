const asNumber = (value: string | undefined, fallback: number): number => {
    if (!value) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const AI_CONFIG = {
    models: {
        card: process.env.NEXT_PUBLIC_AI_MODEL_CARD ?? "gemini-2.5-flash-lite",
        deck: process.env.NEXT_PUBLIC_AI_MODEL_DECK ?? "gemini-2.5-flash-lite",
    },
    generation: {
        responseMimeType: "application/json" as const,
        temperature: asNumber(process.env.NEXT_PUBLIC_AI_TEMPERATURE, 0.4),
        topP: asNumber(process.env.NEXT_PUBLIC_AI_TOP_P, 0.9),
        maxOutputTokens: asNumber(process.env.NEXT_PUBLIC_AI_MAX_OUTPUT_TOKENS, 2048),
    },
    limits: {
        minDeckCards: asNumber(process.env.NEXT_PUBLIC_AI_MIN_DECK_CARDS, 5),
        maxDeckCards: asNumber(process.env.NEXT_PUBLIC_AI_MAX_DECK_CARDS, 30),
    },
};
