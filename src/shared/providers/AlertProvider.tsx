"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

import { AnimatePresence } from "framer-motion";

import { Alert, AlertType } from "@/shared/components/ui";

/** Internal state representation of an active notification. */
interface AlertItem {
    id: string;
    type: AlertType;
    message: string;
}

/** Interface for the global alerting API. */
interface AlertContextType {
    /**
     * Imperative call to trigger a transient notification.
     * @param type - Severity level affecting color and duration.
     * @param message - The content to be announced to the user.
     */
    showAlert: (type: AlertType, message: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

/**
 * Global Notification Orchestrator
 *
 * @remarks
 * Manages a FIFO (First-In-First-Out) stack of notifications. Capped at 3 visible alerts to maintain
 * visual hygiene. Integrates with AnimatePresence to handle physics-based exit transitions.
 */
export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);

    const showAlert = useCallback((type: AlertType, message: string) => {
        setAlerts((prev) => {
            const newItem = { id: Math.random().toString(36).substring(2, 9), type, message };
            // Implementation of logical stack cap (FIFO) to avoid screen clutter
            const next = [...prev, newItem];
            return next.slice(-3);
        });
    }, []);

    const handleClose = useCallback((id: string) => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            {/* ── Alert Stack Container ── */}
            <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-[100] flex flex-col items-center gap-3 sm:right-6 sm:bottom-6 sm:left-auto sm:items-end">
                <AnimatePresence mode="popLayout">
                    {alerts.map((a) => (
                        <Alert
                            key={a.id}
                            type={a.type}
                            message={a.message}
                            onClose={() => handleClose(a.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
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
