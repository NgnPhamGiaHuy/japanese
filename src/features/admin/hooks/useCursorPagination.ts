"use client";

import { useState } from "react";

/**
 * Shared cursor-pagination bookkeeping — the `pageTokens`/`currentPage`
 * shape previously hand-rolled identically in `AdminReportsPageContent` and
 * `AdminUsersPageContent`.
 *
 * @remarks
 * Firestore cursor pagination is inherently sequential — you can't jump to
 * page N without first discovering page N-1's cursor — so this accumulates
 * a `pageTokens[pageIndex] -> cursor` map as pages get visited, rather than
 * computing an offset. This hook owns *how* to navigate/reset that map;
 * *when* to reset (e.g. on a filter change) is caller-specific, so callers
 * that need it call `reset()` themselves.
 */
export function useCursorPagination() {
    const [pageTokens, setPageTokens] = useState<(string | undefined)[]>([undefined]);
    const [currentPage, setCurrentPage] = useState(0);

    const goToNextPage = (nextToken: string | undefined) => {
        if (!nextToken) return;
        setPageTokens((prev) => (prev.includes(nextToken) ? prev : [...prev, nextToken]));
        setCurrentPage((p) => p + 1);
    };

    const goToPreviousPage = () => setCurrentPage((p) => Math.max(0, p - 1));

    const goToPage = (pageIndex: number) => {
        if (pageIndex >= 0 && pageIndex < pageTokens.length) {
            setCurrentPage(pageIndex);
        }
    };

    const reset = () => {
        setPageTokens([undefined]);
        setCurrentPage(0);
    };

    return {
        pageTokens,
        currentPage,
        currentPageToken: pageTokens[currentPage],
        totalDiscoveredPages: pageTokens.length,
        hasPreviousPage: currentPage > 0,
        goToNextPage,
        goToPreviousPage,
        goToPage,
        reset,
    };
}
