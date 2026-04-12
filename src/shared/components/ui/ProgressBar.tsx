"use client";

interface ProgressBarProps {
    value: number; // 0–100
    color?: string;
    height?: string;
    className?: string;
}

const ProgressBar = ({
    value,
    color = "bg-[#1cb0f6]",
    height = "h-2.5",
    className = "",
}: ProgressBarProps) => {
    return (
        <div className={`${height} overflow-hidden rounded-full bg-gray-200 ${className}`}>
            <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    );
};

export default ProgressBar;
