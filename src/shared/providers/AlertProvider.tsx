"use client";

import { useTranslations } from "next-intl";
import React, { createContext, useCallback, useContext, useMemo } from "react";

import { toast, Toaster } from "sonner";

import { Alert, AlertType } from "@/shared/components/ui";

import type { AlertAction } from "@/shared/components/ui";

/** Optional extras for an alert (inline action, custom duration). */
interface AlertOptions {
    action?: AlertAction;
    durationMs?: number;
}

/** Interface for the global alerting API. */
interface AlertContextType {
    /**
     * Imperative call to trigger a transient notification.
     * @param type - Severity level affecting color and duration.
     * @param message - The content to be announced to the user.
     * @param options - Optional inline action (e.g. Undo) and duration override.
     */
    showAlert: (type: AlertType, message: string, options?: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// UX Research: Error/Warning info needs more time to process than simple success.
const ALERT_DURATIONS: Record<AlertType, number> = {
    success: 4000,
    info: 4000,
    warning: 6000,
    error: 8000,
};

/**
 * Global Notification Orchestrator
 *
 * @remarks
 * `showAlert` renders the app's themed `Alert` chrome through sonner's
 * `toast.custom()`, so sonner owns timing, stacking (capped via
 * `visibleToasts`), positioning, swipe-dismiss, and the accessible live
 * region, while the visual design stays the existing one.
 */
export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const t = useTranslations("NotificationsPage");
    const showAlert = useCallback((type: AlertType, message: string, options?: AlertOptions) => {
        toast.custom(
            (id) => (
                <Alert
                    type={type}
                    message={message}
                    action={options?.action}
                    onClose={() => toast.dismiss(id)}
                />
            ),
            { duration: options?.durationMs ?? ALERT_DURATIONS[type] },
        );
    }, []);

    const value = useMemo(() => ({ showAlert }), [showAlert]);

    return (
        <AlertContext.Provider value={value}>
            {children}
            <Toaster
                position="bottom-right"
                visibleToasts={3}
                gap={12}
                containerAriaLabel={t("toastRegion")}
            />
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error("useAlert must be used within an AlertProvider");
    }
    return context;
};
