import type { Metadata } from "next";

import "./globals.css";

import { fontVariables } from "@/lib/fonts";
import { Providers } from "@/lib/providers";
import { ReactScan } from "./_components/ReactScan";

// TODO(E3-T5/ADR-10): no hosting platform decision has been recorded yet
// (no docs/adr/0xx-hosting.md, no firebase.json/vercel.json) — this falls
// back to localhost so metadata/OG URLs resolve correctly in dev until a
// real production domain is set via NEXT_PUBLIC_SITE_URL.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
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
