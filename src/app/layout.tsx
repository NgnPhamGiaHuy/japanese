import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers";

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

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
