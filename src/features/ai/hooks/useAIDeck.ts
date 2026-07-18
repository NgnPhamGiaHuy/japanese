"use client";

import { useAIGeneration } from "./useAIGeneration";
import { generateDeck } from "../services/gemini.service";

const useAIDeck = () => useAIGeneration(generateDeck);

export default useAIDeck;
