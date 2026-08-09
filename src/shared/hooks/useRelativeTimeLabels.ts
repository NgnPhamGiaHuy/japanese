"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import type { RelativeTimeLabels } from "@/shared/utils";

/**
 * Localized wording for `formatRelativeTime`.
 *
 * Exists so the formatter itself can stay a pure, directly-testable function
 * while its wording still comes from the message catalogs — the two consumers
 * (the notifications inbox and a card comment thread) both render inside the
 * locale provider and simply pass this through.
 */
export function useRelativeTimeLabels(): RelativeTimeLabels {
    const t = useTranslations("RelativeTime");
    const locale = useLocale();

    return useMemo(
        () => ({
            justNow: t("justNow"),
            minutes: (count: number) => t("minutes", { count }),
            hours: (count: number) => t("hours", { count }),
            days: (count: number) => t("days", { count }),
            locale,
        }),
        [t, locale],
    );
}
