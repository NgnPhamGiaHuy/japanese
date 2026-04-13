"use client";

import { useCallback, useState, useTransition } from "react";

import { AIServiceError, generateCardData } from "../services";

import type { AIStatus, GeneratedCard } from "../types";

interface UseAICardResult {
    status: AIStatus;
    error: string | null;
    generate: (word: string) => Promise<GeneratedCard | null>;
    reset: () => void;
}

const useAICard = (): UseAICardResult => {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [succeeded, setSucceeded] = useState(false);

    const generate = useCallback(async (word: string): Promise<GeneratedCard | null> => {
        setError(null);
        setSucceeded(false);

        return new Promise<GeneratedCard | null>((resolve) => {
            startTransition(async () => {
                try {
                    const card = await generateCardData(word);
                    setSucceeded(true);
                    resolve(card);
                } catch (err) {
                    const msg =
                        err instanceof AIServiceError
                            ? err.message
                            : "Something went wrong — please try again";
                    setError(msg);
                    resolve(null);
                }
            });
        });
    }, []);

    const reset = useCallback(() => {
        setError(null);
        setSucceeded(false);
    }, []);

    const status: AIStatus = isPending
        ? "loading"
        : error
          ? "error"
          : succeeded
            ? "success"
            : "idle";

    return { status, error, generate, reset };
};

export default useAICard;
