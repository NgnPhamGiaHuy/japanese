import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
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

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Metadata" });

    return {
        metadataBase: new URL(SITE_URL),
        title: t("siteTitle"),
        description: t("siteDescription"),
        // A message can't hold an array, so keywords live as one comma-separated
        // string; ja.json carries Japanese terms plus the English ones.
        keywords: t("keywords").split(","),
    };
}

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
