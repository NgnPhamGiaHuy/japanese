"use client";

import type { ReactNode } from "react";

interface KanaAppShellProps {
    children: ReactNode;
}

/**
 * Standalone kana screen wrapper from app.jsx: full viewport, bg #f7f7f8, max-w-5xl column, sm horizontal padding.
 */
export default function KanaAppShell({ children }: KanaAppShellProps) {
    return (
        <div className="min-h-[100dvh] h-[100dvh] bg-[#f7f7f8] text-[#3c3c3c] flex justify-center overflow-hidden selection:bg-[#1cb0f6] selection:text-white">
            <div className="w-full max-w-5xl px-0 sm:px-6 h-full flex flex-col min-h-0 relative">
                {children}
            </div>
        </div>
    );
}
