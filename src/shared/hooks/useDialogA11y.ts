"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared dialog accessibility behavior for Modal/ConfirmModal-style overlays:
 * moves focus in on open, traps Tab within the dialog while open, closes on
 * Escape, and returns focus to whatever triggered the dialog on close.
 *
 * @returns a ref to attach to the dialog's outermost focusable content container
 * (not the fullscreen backdrop wrapper).
 */
export function useDialogA11y<T extends HTMLElement>(isOpen: boolean, onClose: () => void) {
    const containerRef = useRef<T>(null);
    const triggerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        triggerRef.current = document.activeElement as HTMLElement | null;
        containerRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
                return;
            }

            const container = containerRef.current;
            if (e.key !== "Tab" || !container) return;

            const nodes = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
            if (nodes.length === 0) return;
            const first = nodes[0];
            const last = nodes[nodes.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            triggerRef.current?.focus();
        };
    }, [isOpen, onClose]);

    return containerRef;
}
