"use client";

/**
 * AdminDashboard — Feature root component.
 *
 * @remarks
 * Pure composition — delegates all logic to useAdminDashboard.
 * Renders stats, user table, and delete confirmation modal.
 */
import { useState } from "react";

import { RefreshCw } from "lucide-react";

import { ScreenHeader } from "@/shared/components/layout";
import { Button, ConfirmModal } from "@/shared/components/ui";
import { useAppStore } from "@/store";
import { AdminStatsSection } from "./AdminStatsSection";
import { AdminUserTable } from "./AdminUserTable";
import { useAdminDashboard } from "../hooks/useAdminDashboard";

import type { AdminUser } from "../types";

export function AdminDashboard() {
    const { user } = useAppStore();
    const dashboard = useAdminDashboard();
    const [confirmState, setConfirmState] = useState<{
        user: AdminUser;
        action: "delete" | "promote" | "demote";
    } | null>(null);

    const handleExecuteAction = async () => {
        if (!confirmState) return;
        const { user, action } = confirmState;

        try {
            if (action === "delete") {
                await dashboard.removeUser(user.uid);
            } else {
                await dashboard.bulkSetAdminRole([user.uid], action === "promote");
            }
        } finally {
            setConfirmState(null);
        }
    };

    const actionConfig = confirmState
        ? {
              delete: {
                  title: "Delete User?",
                  message: `Are you sure you want to delete ${confirmState.user.displayName || confirmState.user.email}? This cannot be undone.`,
                  confirmText: "Delete",
                  variant: "danger" as const,
              },
              promote: {
                  title: "Grant Admin?",
                  message: `Promote ${confirmState.user.displayName || confirmState.user.email} to Admin status?`,
                  confirmText: "Promote",
                  variant: "info" as const,
              },
              demote: {
                  title: "Remove Admin?",
                  message: `Revoke admin status for ${confirmState.user.displayName || confirmState.user.email}?`,
                  confirmText: "Demote",
                  variant: "warning" as const,
              },
          }[confirmState.action]
        : null;

    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8] pb-28">
            <ScreenHeader
                title="Admin Dashboard"
                backHref="/"
                right={
                    <Button
                        variant="ghost"
                        onClick={dashboard.refreshUsers}
                        disabled={dashboard.loadingUsers}
                        className="!p-2 shadow-none"
                        icon={RefreshCw}
                        iconSize={18}
                        title="Refresh"
                    />
                }
            />

            <div className="mx-auto max-w-6xl space-y-6 px-4 pt-6 sm:px-6">
                {/* Stats */}
                <AdminStatsSection stats={dashboard.stats} loading={dashboard.loadingStats} />

                {/* User table */}
                <AdminUserTable
                    users={dashboard.users}
                    currentPage={dashboard.currentPage}
                    hasNextPage={dashboard.hasNextPage}
                    hasPrevPage={dashboard.hasPrevPage}
                    loading={dashboard.loadingUsers}
                    meta={{
                        currentUserId: user?.uid,
                        mutating: dashboard.mutating,
                        onPromote: (uid) => {
                            const u = dashboard.users.find((u) => u.uid === uid);
                            if (u) setConfirmState({ user: u, action: "promote" });
                        },
                        onDemote: (uid) => {
                            const u = dashboard.users.find((u) => u.uid === uid);
                            if (u) setConfirmState({ user: u, action: "demote" });
                        },
                        onDeleteRequest: (u) => setConfirmState({ user: u, action: "delete" }),
                    }}
                    onNextPage={dashboard.goToNextPage}
                    onPrevPage={dashboard.goToPrevPage}
                    onBulkDelete={dashboard.bulkRemoveUsers}
                    onBulkSetRole={dashboard.bulkSetAdminRole}
                />
            </div>

            {/* Global individual action confirmation */}
            <ConfirmModal
                isOpen={!!confirmState}
                onClose={() => setConfirmState(null)}
                onConfirm={handleExecuteAction}
                title={actionConfig?.title ?? ""}
                message={actionConfig?.message ?? ""}
                confirmText={actionConfig?.confirmText ?? ""}
                variant={actionConfig?.variant ?? "danger"}
                loading={confirmState ? dashboard.mutating[confirmState.user.uid] : false}
            />
        </div>
    );
}
