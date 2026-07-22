"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

import Button from "./Button";

/**
 * Shared chrome for every Base UI `Dialog.Root` composition in the app (ADR-110, T-110a).
 *
 * Two tiers consume it:
 * - **Tier 1 — standard.** A fully pre-built component (`Modal`, `ConfirmModal`) renders
 *   both `DIALOG_BACKDROP_CLASSNAME` and `DialogCloseButton` itself; callers never touch
 *   `Dialog.*` directly.
 * - **Tier 2 — bespoke.** A feature hand-composes its own `Dialog.Root`/`Portal`/`Popup`
 *   for a layout Tier 1 can't express (a slide-over panel, a fused search+list palette,
 *   an owner-only permissions dialog) but still imports `DIALOG_BACKDROP_CLASSNAME` from
 *   here rather than hand-rolling the backdrop. `DeckDetailsPanel`, `AdminSidebar`'s mobile
 *   drawer, `ShareModal`, and `CommandPalette` are the sanctioned Tier-2 surfaces today.
 *   Tier 2 keeps its own close-affordance styling (position/size vary by layout) rather
 *   than adopting `DialogCloseButton` — only the backdrop is required to be single-sourced.
 *
 * Either tier, `DIALOG_BACKDROP_CLASSNAME` is the **only** backdrop className in the tree —
 * no composition hardcodes its own backdrop string.
 */
export const DIALOG_BACKDROP_CLASSNAME =
    "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0";

interface DialogCloseButtonProps {
    disabled?: boolean;
}

/** The ghost/icon "X" close button Tier-1 dialogs (Modal, ConfirmModal) render via Dialog.Close. */
export const DialogCloseButton = ({ disabled }: DialogCloseButtonProps) => (
    <Dialog.Close
        disabled={disabled}
        render={
            <Button
                variant="ghost"
                size="icon"
                className="rounded-full shadow-none hover:bg-black/5"
                icon={X}
                iconSize={20}
                disabled={disabled}
            />
        }
    />
);
