import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
    color?: string;
    size?: number;
    fullScreen?: boolean;
    label?: string;
}

export function LoadingSpinner({
    color = "#1cb0f6",
    size = 32,
    fullScreen = true,
    label,
}: LoadingSpinnerProps) {
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
                    <p className="text-lg font-black tracking-tight text-[#3c3c3c]">{label}</p>
                    <p className="text-xs font-bold tracking-widest text-[#afafaf] uppercase">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F7F7F8]/80 backdrop-blur-sm">
            {spinner}
        </div>
    );
}
