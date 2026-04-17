/**
 * LoadingSpinner Component
 *
 * @remarks
 * Reusable loading spinner with customizable color.
 * Used across all loading states in the app.
 */

interface LoadingSpinnerProps {
    /** Hex color for the spinner (default: #1cb0f6) */
    color?: string;
    /** Size in pixels (default: 32) */
    size?: number;
}

/**
 * Full-screen centered loading spinner
 */
export function LoadingSpinner({ color = "#1cb0f6", size = 32 }: LoadingSpinnerProps) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
            <div
                className="animate-spin rounded-full border-4 border-gray-200"
                style={{
                    width: size,
                    height: size,
                    borderTopColor: color,
                }}
            />
        </div>
    );
}
