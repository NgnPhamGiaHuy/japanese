"use client";

import { useAIGeneration } from "./useAIGeneration";
import { generateCardData } from "../services/gemini.service";

const useAICard = () => useAIGeneration(generateCardData);

export default useAICard;
