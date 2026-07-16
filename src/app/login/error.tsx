"use client";

import { useEffect } from "react";

import * as Sentry from "@sentry/nextjs";

import ErrorFallback from "../_components/ErrorFallback";

export default function LoginError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[error boundary: /login]", error);
        Sentry.captureException(error);
    }, [error]);

    return <ErrorFallback scope="the sign-in page" reset={reset} />;
}
