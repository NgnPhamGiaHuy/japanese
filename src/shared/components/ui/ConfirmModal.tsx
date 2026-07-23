"use client";

import { useTranslations } from "next-intl";

import { Dialog } from "@base-ui/react/dialog";
import { AlertTriangle, Info, Trash2 } from "lucide-react";

import { SEMANTIC_STATUS } from "@/shared/utils";
import Button from "./Button";
import { DIALOG_BACKDROP_CLASSNAME, DialogCloseButton } from "./DialogChrome";

/** Supported visual variants for the confirmation modal. */
type ConfirmVariant = "danger" | "warning" | "info";

/** Attributes for rendering a ConfirmModal. */
interface ConfirmModalProps {
    /** Whether the modal is currently visible. */
    isOpen: boolean;
    /** Triggered when the user cancels or closes the modal. */
    onClose: () => void;
    /** Triggered when the user confirms the action. */
    onConfirm: () => void;
    /** Primary heading text. */
    title: string;
    /** Secondary descriptive text explaining the action. */
    message: string;
    /** Text for the confirmation button (default: "Confirm"). */
    confirmText?: string;
    /** Text for the cancellation button (default: "Cancel"). */
    cancelText?: string;
    /** Visual theme variant determining colors and icons. */
    variant?: ConfirmVariant;
    /** Whether to show a loading state on the confirm button. */
    loading?: boolean;
}

/**
 * High-stakes confirmation dialog.
 *
 * @remarks
 * Used for dangerous or important actions (e.g., deletions, resets).
 * Features a central themed icon and clear action hierarchy.
 *
 * @example
 * <ConfirmModal
 *   isOpen={showDelete}
 *   onClose={() => setShowDelete(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Account?"
 *   message="This action is irreversible."
 *   variant="danger"
 * />
 */

const VARIANTS = {
    danger: {
        icon: Trash2,
        color: SEMANTIC_STATUS.danger.theme,
        accent: `${SEMANTIC_STATUS.danger.bg} ${SEMANTIC_STATUS.danger.text}`,
        btnVariant: "primary",
    },
    warning: {
        icon: AlertTriangle,
        color: SEMANTIC_STATUS.warning.theme,
        accent: `${SEMANTIC_STATUS.warning.bg} ${SEMANTIC_STATUS.warning.text}`,
        btnVariant: "primary",
    },
    info: {
        icon: Info,
        color: SEMANTIC_STATUS.info.theme,
        accent: `${SEMANTIC_STATUS.info.bg} ${SEMANTIC_STATUS.info.text}`,
        btnVariant: "primary",
    },
} as const;

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    variant = "danger",
    loading = false,
}: ConfirmModalProps) => {
    const t = useTranslations("Common");
    const v = VARIANTS[variant];
    const Icon = v.icon;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
            <Dialog.Portal>
                {/* Backdrop */}
                <Dialog.Backdrop className={DIALOG_BACKDROP_CLASSNAME} />

                {/* Centering layer — pointer-events pass through to the backdrop except over the modal itself */}
                <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <Dialog.Popup
                        aria-modal="true"
                        className="rounded-5xl pointer-events-auto relative w-full max-w-sm overflow-hidden border-2 border-b-8 border-gray-200 bg-white shadow-2xl transition-all duration-200 data-[ending-style]:translate-y-5 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-5 data-[starting-style]:scale-90 data-[starting-style]:opacity-0"
                    >
                        {/* Close button */}
                        <div className="absolute top-4 right-4 z-10">
                            <DialogCloseButton disabled={loading} />
                        </div>

                        <div className="p-8 pt-10">
                            {/* Icon Circle */}
                            <div
                                className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-4xl border-b-4 border-black/10 ${v.accent}`}
                            >
                                <Icon size={40} strokeWidth={2.5} />
                            </div>

                            {/* Text Header */}
                            <div className="text-center">
                                <Dialog.Title className="text-text mb-2 text-xl font-black">
                                    {title}
                                </Dialog.Title>
                                <Dialog.Description className="text-muted text-base leading-relaxed font-bold">
                                    {message}
                                </Dialog.Description>
                            </div>

                            {/* Actions */}
                            <div className="mt-8 flex flex-col gap-3">
                                <Button
                                    variant={v.btnVariant}
                                    color={v.color}
                                    onClick={onConfirm}
                                    loading={loading}
                                    size="auto"
                                    className="w-full px-4 py-4 text-base md:px-6"
                                >
                                    {confirmText ?? t("confirm")}
                                </Button>
                                <Button
                                    variant="plain"
                                    size="auto"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="text-muted hover:text-text w-full rounded-xl px-4 py-4 text-base font-black hover:bg-gray-50 active:translate-y-0 md:px-6"
                                >
                                    {cancelText ?? t("cancel")}
                                </Button>
                            </div>
                        </div>
                    </Dialog.Popup>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default ConfirmModal;
