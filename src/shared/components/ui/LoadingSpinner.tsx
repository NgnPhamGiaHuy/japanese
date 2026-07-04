/**
 * Premium loading spinner component.
 *
 * @remarks
 * Features a central spinning icon with a subtle pulse animation.
 * Can be rendered inline or as a full-screen overlay with optional status labels.
 *
 * @example
 * <LoadingSpinner label="Saving progress..." fullScreen={false} />
 */
import { Loader2 } from "lucide-react";

/** Attributes for rendering a LoadingSpinner. */
interface LoadingSpinnerProps {
    /** Primary color for the spinner and accent animations. */
    color?: string;
    /** Diameter of the spinner in pixels. */
    size?: number;
    /** Whether to occupy the entire viewport with a backdrop. */
    fullScreen?: boolean;
    /** Optional status message to display below the spinner. */
    label?: string;
}

const LoadingSpinner = ({
    color = "#1cb0f6",
    size = 32,
    fullScreen = true,
    label,
}: LoadingSpinnerProps) => {
    const spinner = (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative flex items-center justify-center">
                <Loader2 size={size} style={{ color }} className="animate-spin" />
                <div
                    className="absolute animate-ping rounded-full opacity-10"
                    style={{ backgroundColor: color, width: size * 0.7, height: size * 0.7 }}
                />
            </div>
            {label && (
                <div className="flex flex-col items-center gap-1">
                    <p className="text-text text-lg font-black tracking-tight">{label}</p>
                    <p className="text-muted text-xs font-bold tracking-widest uppercase">
                        Crunching latest platform data
                    </p>
                </div>
            )}
        </div>
    );

    if (!fullScreen) {
        return (
            <div className="flex w-full flex-col items-center justify-center py-10">{spinner}</div>
        );
    }

    return (
        <div className="bg-bg/80 fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm">
            {spinner}
        </div>
    );
};

export default LoadingSpinner;
