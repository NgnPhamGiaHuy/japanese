import { useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";

import { Button } from "@/shared/components/ui";

/** Categorization of the notification severity and visual intent. */
export type AlertType = "info" | "success" | "warning" | "error";

/** Attributes for rendering a transient notification. */
interface AlertProps {
    /** Visual theme and icon mapping. */
    type: AlertType;
    /** The content string to be displayed. */
    message: string;
    /** Triggered when the user dismisses the alert or the timer expires. */
    onClose: () => void;
}

/**
 * Premium toast notification component.
 *
 * @remarks
 * Orchestrates a physics-based, timed entry/exit lifecycle. Features 'Pause on Hover'
 * functionality to prevent premature dismissal while users are reading high-density messages.
 *
 * @example
 * <Alert type="success" message="File saved!" onClose={handleDismiss} />
 */
const Alert = ({ type, message, onClose }: AlertProps) => {
    const [isPaused, setIsPaused] = useState(false);
    // Persists the remaining duration across re-renders when paused
    const timeLeft = useRef<number>(0);
    // Ensures current callback is always used without breaking effect stability
    const closeRef = useRef(onClose);

    // UX Research: Error/Warning info needs more time to process than simple success.
    const durations: Record<AlertType, number> = {
        success: 4000,
        info: 4000,
        warning: 6000,
        error: 8000,
    };

    // Keep the callback fresh without triggering timer resets
    useEffect(() => {
        closeRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (isPaused) return;

        // Uses stored time if resume after pause, otherwise falls back to defaults
        const duration = timeLeft.current || durations[type];
        const start = Date.now();

        const timer = setTimeout(() => {
            closeRef.current();
        }, duration);

        return () => {
            clearTimeout(timer);
            // Deducts time already spent to ensure accurate resume when paused
            const elapsed = Date.now() - start;
            timeLeft.current = Math.max(0, duration - elapsed);
        };
    }, [type, isPaused]);

    const config = {
        info: {
            icon: <Info size={20} />,
            bg: "bg-blue-50",
            border: "border-blue-200",
            text: "text-blue-800",
            iconColor: "text-blue-500",
        },
        success: {
            icon: <CheckCircle size={20} />,
            bg: "bg-emerald-50",
            border: "border-emerald-200",
            text: "text-emerald-800",
            iconColor: "text-emerald-500",
        },
        warning: {
            icon: <AlertCircle size={20} />,
            bg: "bg-amber-50",
            border: "border-amber-200",
            text: "text-amber-800",
            iconColor: "text-amber-500",
        },
        error: {
            icon: <XCircle size={20} />,
            bg: "bg-rose-50",
            border: "border-rose-200",
            text: "text-rose-800",
            iconColor: "text-rose-500",
        },
    };

    const { icon, bg, border, text, iconColor } = config[type];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
            }}
            className={`group pointer-events-auto flex items-center gap-4 rounded-[1.5rem] border-2 p-5 shadow-xl transition-colors sm:max-w-md sm:min-w-[360px] ${bg} ${border} ${text}`}
        >
            <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/50 ${iconColor} shadow-sm`}
            >
                {icon}
            </div>
            <div className="flex-1 text-sm leading-relaxed font-bold">{message}</div>
            <Button
                variant="ghost"
                onClick={onClose}
                className="!p-1.5 opacity-40 transition-all hover:opacity-100"
                icon={X}
            />
        </motion.div>
    );
};

export default Alert;
