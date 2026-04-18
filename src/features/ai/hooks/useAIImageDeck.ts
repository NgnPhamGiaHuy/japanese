import { useState } from "react";

import { generateDeckFromImages } from "../services/gemini.service";

import type { GeneratedCard } from "../types";

export function useAIImageDeck() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = async (files: File[], existingWords: string[] = []) => {
        setLoading(true);
        setError(null);
        try {
            const result = await generateDeckFromImages(
                files,
                { userLevel: "JLPT N5" },
                existingWords,
            );
            return result;
        } catch (err: any) {
            const msg = err.message || "Failed to analyze images";
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        generate,
        loading,
        error,
    };
}
