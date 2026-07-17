"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CommandPalette = dynamic(() => import("./CommandPalette"), { ssr: false });

/**
 * Always-mounted (cheap: one keydown listener) so ⌘K/Ctrl+K works from any
 * route. The actual cmdk UI is only imported after the first keypress —
 * `hasOpened` latches true and never resets, so later opens stay mounted for
 * Dialog's close transition instead of re-triggering the dynamic import.
 */
const CommandPaletteLauncher = () => {
    const [open, setOpen] = useState(false);
    const [hasOpened, setHasOpened] = useState(false);

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            const isTriggerCombo =
                (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
            if (!isTriggerCombo) return;

            event.preventDefault();
            setHasOpened(true);
            setOpen((prev) => !prev);
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    if (!hasOpened) return null;

    return <CommandPalette open={open} onOpenChange={setOpen} />;
};

export default CommandPaletteLauncher;
