import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import "../globals.css";

import MaintenanceScreen from "@/app/_components/MaintenanceScreen";
import { ReactScan } from "@/app/_components/ReactScan";
import { routing } from "@/i18n/routing";
import { getFlags } from "@/lib/flags";
import { fontVariables } from "@/lib/fonts";
import { Providers } from "@/lib/providers";

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

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }
    setRequestLocale(locale);

    const flags = await getFlags();

    return (
        <html lang={locale} className={fontVariables}>
            <body suppressHydrationWarning>
                <ReactScan />
                <NextIntlClientProvider>
                    {flags.maintenance_mode ? (
                        <MaintenanceScreen />
                    ) : (
                        <Providers>{children}</Providers>
                    )}
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
