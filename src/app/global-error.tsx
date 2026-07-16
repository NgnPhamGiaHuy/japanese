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
                <ErrorFallback scope="the app" reset={reset} />
            </body>
        </html>
    );
}
