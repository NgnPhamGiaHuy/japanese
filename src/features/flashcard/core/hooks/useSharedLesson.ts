import { useEffect, useState } from "react";

import { SharedLoadError } from "@/features/flashcard/core/services/shared.service";
import { useAppStore } from "@/store";
import { getSharedLesson } from "../services";

import type { SharedLessonResult } from "../services";

export type SharedLessonStatus = "loading" | "not_found" | "error" | "ready";

/**
 * Fetches and resolves a lesson for the shared preview/landing page.
 *
 * @remarks
 * Defers the fetch until Firebase auth has resolved to prevent false 404s.
 * Distinguishes between not-found/access-denied (status: "not_found") and
 * network/quota failures (status: "error") so the UI can show a retry option.
 *
 * @param shareId - The URL-safe Base64 share token.
 */
export function useSharedLesson(shareId: string) {
    const { user, isAuthReady } = useAppStore();
    const [result, setResult] = useState<SharedLessonResult | null>(null);
    const [status, setStatus] = useState<SharedLessonStatus>("loading");
    const [error, setError] = useState<SharedLoadError | null>(null);

    useEffect(() => {
        if (!shareId) return;
        // Defer until auth resolves to avoid false 404s on slow networks.
        if (!isAuthReady) return;

        setStatus("loading");
        setError(null);

        getSharedLesson(shareId, user?.uid, user)
            .then((res) => {
                if (!res) {
                    setStatus("not_found");
                } else {
                    setResult(res);
                    setStatus("ready");
                }
            })
            .catch((err) => {
                if (err instanceof SharedLoadError) {
                    setError(err);
                    setStatus("error");
                } else {
                    setStatus("not_found");
                }
            });
    }, [shareId, user?.uid, isAuthReady]);

    return { result, status, error };
}
