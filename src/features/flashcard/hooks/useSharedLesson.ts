import { useEffect, useState } from "react";

import { useAppStore } from "@/store";
import { getSharedLesson } from "../services";

import type { SharedLessonResult } from "../services";

/**
 * Fetches and resolves a lesson for the shared preview/landing page.
 *
 * @remarks
 * This hook is critical for the "Shared Link" workflow. It resolves:
 * 1. **Public Metadata**: Content available for anonymous viewers.
 * 2. **Access Control**: Resolves whether the `currentUser` has explicit permissions (e.g., as a collaborator).
 * 3. **Existence**: Handles the `not_found` state for invalid share IDs.
 *
 * @param shareId - The unique base64/hash ID from the sharing link.
 * @returns The resolved lesson data and a loading/status flag.
 */
export function useSharedLesson(shareId: string) {
    const { user } = useAppStore();
    const [result, setResult] = useState<SharedLessonResult | null>(null);
    const [status, setStatus] = useState<"loading" | "not_found" | "ready">("loading");

    useEffect(() => {
        if (!shareId) return;

        getSharedLesson(shareId, user?.uid)
            .then((res) => {
                if (!res) setStatus("not_found");
                else {
                    setResult(res);
                    setStatus("ready");
                }
            })
            .catch(() => setStatus("not_found"));
    }, [shareId, user?.uid]);

    return { result, status };
}
