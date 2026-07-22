"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

import Button from "./Button";

/** Shared backdrop classNames for every Base UI Dialog-based overlay (Modal, ConfirmModal). */
export const DIALOG_BACKDROP_CLASSNAME =
    "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0";

interface DialogCloseButtonProps {
    disabled?: boolean;
}

/** The ghost/icon "X" close button every dialog variant renders via Dialog.Close. */
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
