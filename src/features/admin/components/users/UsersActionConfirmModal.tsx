"use client";

import { AdminConfirmModal } from "../shared";

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
 * Reuses the AdminConfirmModal as the single source of truth for admin actions.
 */
const UsersActionConfirmModal = ({
    pendingAction,
    isProcessing,
    onClose,
    onConfirm,
}: UsersActionConfirmModalProps) => {
    if (!pendingAction) return null;

    const { type, uids } = pendingAction;

    return (
        <AdminConfirmModal
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
            isLoading={isProcessing}
        />
    );
};

export default UsersActionConfirmModal;
