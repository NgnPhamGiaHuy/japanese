"use client";

import { useCallback, useRef, useState, useTransition } from "react";

import { AIServiceError, generateDistractors } from "../services";

import type { AIStatus } from "../types";

interface UseAIDistractorsResult {
    status: AIStatus;
    error: string | null;
    generate: (word: string, correctMeaning: string) => Promise<string[] | null>;
    reset: () => void;
}

const useAIDistractors = (): UseAIDistractorsResult => {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [succeeded, setSucceeded] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const generate = useCallback(
        async (word: string, correctMeaning: string): Promise<string[] | null> => {
            abortRef.current?.abort();
            abortRef.current = new AbortController();

            setError(null);
            setSucceeded(false);

            return new Promise<string[] | null>((resolve) => {
                startTransition(async () => {
                    try {
                        const distractors = await generateDistractors(word, correctMeaning);
                        if (abortRef.current?.signal.aborted) {
                            resolve(null);
                            return;
                        }
                        setSucceeded(true);
                        resolve(distractors);
                    } catch (err) {
                        const msg =
                            err instanceof AIServiceError
                                ? err.message
                                : "Could not generate distractors — try again";
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

export default useAIDistractors;
