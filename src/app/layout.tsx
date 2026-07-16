import type { Metadata } from "next";

import "./globals.css";

import { fontVariables } from "@/lib/fonts";
import { Providers } from "@/lib/providers";
import { ReactScan } from "./_components/ReactScan";

export const metadata: Metadata = {
    title: "Kana & Nihongo Master",
    description:
        "Learn hiragana, katakana and Japanese vocabulary with quizzes, survival mode, and flashcards.",
    keywords: [
        "Japanese",
        "hiragana",
        "katakana",
        "kana",
        "flashcard",
        "JLPT",
        "language learning",
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={fontVariables}>
            <body suppressHydrationWarning>
                <ReactScan />
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
