import { buildCardPrompt, buildDeckPrompt } from "../prompts";

import type { JLPTLevel } from "../types";

export const getCardGenerationPrompt = (word: string): string => buildCardPrompt(word);

export const getDeckGenerationPrompt = (topic: string, count: number, level: JLPTLevel): string =>
    buildDeckPrompt(topic, count, level);
