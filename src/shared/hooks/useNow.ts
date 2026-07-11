"use client";

import { useEffect, useState } from "react";

/**
 * Returns the current epoch-ms clock, re-rendering on an interval so relative
 * timestamps ("2m ago") stay live without a per-item timer. Mount ONE per list
 * and thread the value down to rows.
 *
 * @param intervalMs how often to tick (default 30s)
 */
export function useNow(intervalMs = 30_000): number {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);
    return now;
}
