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
import { SITE_URL } from "@/lib/site";

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
