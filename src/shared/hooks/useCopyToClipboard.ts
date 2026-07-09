"use client";

import { useState } from "react";

/**
 * Writes text to the clipboard and tracks a `copied` flag that auto-resets
 * after `resetDelayMs`, so callers can show "Copied!" feedback without
 * hand-rolling the same setState + setTimeout dance.
 */
export function useCopyToClipboard(resetDelayMs = 2000) {
    const [copied, setCopied] = useState(false);

    const copy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetDelayMs);
    };

    return { copied, copy };
}
