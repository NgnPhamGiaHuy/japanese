"use client";

import { useCallback, useState, useTransition } from "react";

import { AIServiceError, generateDeck } from "../services";

import type { AIStatus, GeneratedCard, JLPTLevel } from "../types";

interface UseAIDeckResult {
    status: AIStatus;
    error: string | null;
    generate: (topic: string, count: number, level: JLPTLevel) => Promise<GeneratedCard[] | null>;
    reset: () => void;
}

const useAIDeck = (): UseAIDeckResult => {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [succeeded, setSucceeded] = useState(false);

    const generate = useCallback(
        async (topic: string, count: number, level: JLPTLevel): Promise<GeneratedCard[] | null> => {
            setError(null);
            setSucceeded(false);

            return new Promise<GeneratedCard[] | null>((resolve) => {
                startTransition(async () => {
                    try {
                        const cards = await generateDeck(topic, count, level);
                        setSucceeded(true);
                        resolve(cards);
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
        },
        [],
    );

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

export default useAIDeck;
