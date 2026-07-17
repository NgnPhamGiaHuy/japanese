"use client";

import { useEffect } from "react";

import * as Sentry from "@sentry/nextjs";

import ErrorFallback from "./_components/ErrorFallback";

import "./globals.css";

import { fontVariables } from "@/lib/fonts";

/**
 * Root-level error boundary. Fires when the root layout itself throws (a
 * crash below the html/body it normally owns), so this file must render its
 * own <html>/<body> — it fully replaces the root layout, not augments it.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[global error boundary]", error);
        Sentry.captureException(error);
    }, [error]);

    return (
        <html lang="en" className={fontVariables}>
            <body>
                {/*
                  English-only by necessity: this boundary replaces the root
                  layout, so NextIntlClientProvider isn't mounted and there is
                  no locale context to translate against. lang="en" above says
                  the same thing.
                */}
                <ErrorFallback
                    message="An unexpected error occurred while loading the app. You can try again, or head back home."
                    reset={reset}
                />
            </body>
        </html>
    );
}
