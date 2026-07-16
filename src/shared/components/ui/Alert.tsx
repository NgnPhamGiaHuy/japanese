/**
 * Premium toast notification content.
 *
 * @remarks
 * Purely presentational — timing, stacking, positioning, swipe-dismiss, and
 * the accessible live-region announcement are all owned by sonner (rendered
 * via `toast.custom()` in AlertProvider). This component only renders the
 * icon/message/action/close chrome for a given severity.
 *
 * @example
 * <Alert type="success" message="File saved!" onClose={handleDismiss} />
 */
import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";

import Button from "./Button";

/** Categorization of the notification severity and visual intent. */
export type AlertType = "info" | "success" | "warning" | "error";

/** An optional inline action (e.g. "Undo") rendered before the close button. */
export interface AlertAction {
    label: string;
    onClick: () => void;
}

/** Attributes for rendering a transient notification. */
interface AlertProps {
    /** Visual theme and icon mapping. */
    type: AlertType;
    /** The content string to be displayed. */
    message: string;
    /** Triggered when the user dismisses the alert. */
    onClose: () => void;
    /** Optional inline action button (e.g. Undo). Dismisses after firing. */
    action?: AlertAction;
}

const CONFIG: Record<
    AlertType,
    { icon: React.ReactNode; bg: string; border: string; text: string; iconColor: string }
> = {
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

const Alert = ({ type, message, onClose, action }: AlertProps) => {
    const { icon, bg, border, text, iconColor } = CONFIG[type];

    return (
        <div
            className={`group pointer-events-auto flex items-center gap-4 rounded-3xl border-2 p-5 shadow-xl transition-colors sm:max-w-md sm:min-w-[360px] ${bg} ${border} ${text}`}
        >
            <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/50 ${iconColor} shadow-sm`}
            >
                {icon}
            </div>
            <div className="flex-1 text-sm leading-relaxed font-bold">{message}</div>
            {action && (
                <Button
                    variant="ghost"
                    onClick={() => {
                        action.onClick();
                        onClose();
                    }}
                    className="!shrink-0 !rounded-lg !px-2.5 !py-1 !text-xs !font-black underline underline-offset-2 shadow-none hover:!bg-white/50 hover:shadow-none active:translate-y-0"
                >
                    {action.label}
                </Button>
            )}
            <Button
                variant="ghost"
                onClick={onClose}
                aria-label="Dismiss"
                className="!p-1.5 opacity-40 transition-all hover:opacity-100"
                icon={X}
            />
        </div>
    );
};

export default Alert;
