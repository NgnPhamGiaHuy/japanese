"use client";

import { ConfirmModal } from "@/shared/components/ui";

interface UsersActionConfirmModalProps {
    pendingAction: { type: "delete" | "promote" | "demote"; uids: string[] } | null;
    isProcessing: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

/**
 * Specialized Confirmation Modal for User Management.
 *
 * @remarks Handles bulk and individual permission/deletion confirmations.
 * Following component rules, this isolates complex modal messaging logic.
 */
export const UsersActionConfirmModal = ({
    pendingAction,
    isProcessing,
    onClose,
    onConfirm,
}: UsersActionConfirmModalProps) => {
    if (!pendingAction) return null;

    const { type, uids } = pendingAction;

    return (
        <ConfirmModal
            isOpen={!!pendingAction}
            onClose={onClose}
            onConfirm={onConfirm}
            title={
                type === "delete"
                    ? "Delete Users?"
                    : type === "promote"
                      ? "Promote Users?"
                      : "Demote Users?"
            }
            message={
                uids.length === 1
                    ? `Are you sure you want to ${type} this user?`
                    : `Apply "${type}" to ${uids.length} selected users?`
            }
            confirmText="Confirm"
            variant={type === "delete" ? "danger" : "info"}
            loading={isProcessing}
        />
    );
};
