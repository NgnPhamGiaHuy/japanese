"use client";

import { useCallback, useState, useTransition } from "react";

import { AIServiceError } from "../services/gemini.service";

import type { AIStatus } from "../types";

interface UseAIGenerationResult<Args extends unknown[], Result> {
    status: AIStatus;
    error: string | null;
    generate: (...args: Args) => Promise<Result | null>;
    reset: () => void;
}

/**
 * Generic wrapper around a single Gemini generation call: useTransition-backed
 * pending state, a `status` enum derived from pending/error/succeeded, and the
 * shared "something went wrong" fallback for non-AIServiceError failures.
 * useAICard/useAIDeck are both this hook bound to one Gemini function — they
 * previously reimplemented this exact machinery independently, differing
 * only in which function they called and its argument/return shape.
 */
export function useAIGeneration<Args extends unknown[], Result>(
    generateFn: (...args: Args) => Promise<Result>,
): UseAIGenerationResult<Args, Result> {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [succeeded, setSucceeded] = useState(false);

    const generate = useCallback(
        async (...args: Args): Promise<Result | null> => {
            setError(null);
            setSucceeded(false);

            return new Promise<Result | null>((resolve) => {
                startTransition(async () => {
                    try {
                        const result = await generateFn(...args);
                        setSucceeded(true);
                        resolve(result);
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
        [generateFn],
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
}
