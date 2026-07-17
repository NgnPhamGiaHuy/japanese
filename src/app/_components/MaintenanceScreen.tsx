import { useTranslations } from "next-intl";

import { Wrench } from "lucide-react";

/**
 * Rendered by the root layout in place of the app when the maintenance_mode
 * flag (src/lib/flags.ts, Remote Config) is on. No dependency on app
 * providers/router context, matching ErrorFallback's constraints — this can
 * be the only thing on the page. It does sit inside NextIntlClientProvider
 * (the layout renders it there), so unlike ErrorFallback it can translate.
 */
export default function MaintenanceScreen() {
    const t = useTranslations("ErrorScreens");

    return (
        <div className="bg-bg flex min-h-dvh flex-col items-center justify-center p-6 text-center">
            <div className="rounded-6xl border-katakana-strong bg-katakana mb-8 flex h-32 w-32 -rotate-6 transform items-center justify-center border-b-8 text-white shadow-sm">
                <Wrench size={64} strokeWidth={2.5} />
            </div>

            <h1 className="text-text mb-4 text-4xl font-black">{t("maintenanceTitle")}</h1>
            <p className="text-muted text-lg font-bold">{t("maintenanceMessage")}</p>
        </div>
    );
}
