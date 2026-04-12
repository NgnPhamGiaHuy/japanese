"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ScreenHeaderProps {
    title: string;
    backHref?: string;
    onBack?: () => void;
    right?: React.ReactNode;
}

export default function ScreenHeader({
    title,
    backHref,
    onBack,
    right,
}: ScreenHeaderProps) {
    const BackButton = backHref ? (
        <Link
            href={backHref}
            className="flex items-center justify-center w-10 h-10 rounded-xl text-[#afafaf] hover:text-[#3c3c3c] hover:bg-gray-100 transition-colors"
            aria-label="Go back"
        >
            <ArrowLeft size={22} strokeWidth={2.5} />
        </Link>
    ) : onBack ? (
        <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-xl text-[#afafaf] hover:text-[#3c3c3c] hover:bg-gray-100 transition-colors"
            aria-label="Go back"
        >
            <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
    ) : (
        // Placeholder to keep title centred when there is no back button
        <div className="w-10" />
    );

    return (
        <header className="sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b-2 border-gray-200 px-4 py-3 flex items-center justify-between">
            {BackButton}
            <h1 className="font-black text-lg text-[#3c3c3c] text-center flex-1 px-2 truncate">
                {title}
            </h1>
            <div className="w-10 flex items-center justify-end">
                {right ?? null}
            </div>
        </header>
    );
}
