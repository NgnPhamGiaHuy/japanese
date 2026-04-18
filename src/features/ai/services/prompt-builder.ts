import { buildCardPrompt, buildDeckPrompt, generateDeckFromImagesPrompt } from "../prompts";

import type { JLPTLevel } from "../types";

export const getCardGenerationPrompt = (word: string): string => buildCardPrompt(word);

export const getDeckGenerationPrompt = (
    topic: string,
    count: number,
    level: JLPTLevel,
    existingWords: string[] = [],
): string => buildDeckPrompt(topic, count, level, existingWords);

export const getDeckFromImagesPrompt = (context?: { userLevel?: string }) =>
    generateDeckFromImagesPrompt(context);
