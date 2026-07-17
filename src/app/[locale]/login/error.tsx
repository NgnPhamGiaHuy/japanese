"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import * as Sentry from "@sentry/nextjs";

import ErrorFallback from "@/app/_components/ErrorFallback";

export default function LoginError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations("ErrorScreens");

    useEffect(() => {
        console.error("[error boundary: /login]", error);
        Sentry.captureException(error);
    }, [error]);

    return (
        <ErrorFallback
            title={t("errorTitle")}
            message={t("errorMessage", { scope: t("scopeLogin") })}
            retryLabel={t("tryAgain")}
            homeLabel={t("goHome")}
            reset={reset}
        />
    );
}
