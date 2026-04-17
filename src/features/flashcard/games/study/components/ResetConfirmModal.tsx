/**
 * ResetConfirmModal — SRS Progress Reset Confirmation
 *
 * @remarks
 * Displays warning modal before resetting all SRS progress for a deck.
 * Destructive action requiring explicit confirmation.
 */

"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/shared/components/ui";

interface ResetConfirmModalProps {
    lessonTitle: string;
    resetting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ResetConfirmModal = ({
    lessonTitle,
    resetting,
    onConfirm,
    onCancel,
}: ResetConfirmModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
            <div className="w-full max-w-sm rounded-3xl border-2 border-b-8 border-gray-200 bg-white p-8 shadow-xl">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                    <RotateCcw size={28} className="text-[#ea2b2b]" />
                </div>
                <h2 className="mb-2 text-xl font-black text-[#3c3c3c]">Reset Progress?</h2>
                <p className="mb-6 text-sm font-bold text-[#afafaf]">
                    This will reset all SRS progress for every card in{" "}
                    <span className="text-[#3c3c3c]">{lessonTitle}</span>. All intervals and review
                    dates will be cleared. This cannot be undone.
                </p>
                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        disabled={resetting}
                        className="!flex-1 !rounded-2xl !border-2 !border-b-4 !border-gray-200 !bg-white !py-3 !text-sm !font-black !text-[#3c3c3c] shadow-none transition-all hover:!bg-gray-50 hover:shadow-none active:translate-y-0 disabled:opacity-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        color="red"
                        onClick={onConfirm}
                        disabled={resetting}
                        className="!flex-1 !rounded-2xl !border-2 !border-b-4 !py-3 !text-sm !font-black transition-all disabled:opacity-50"
                    >
                        {resetting ? "Resetting…" : "Reset All"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ResetConfirmModal;
