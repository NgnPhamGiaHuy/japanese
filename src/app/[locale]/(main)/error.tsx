"use client";

import { useEffect } from "react";

import * as Sentry from "@sentry/nextjs";

import ErrorFallback from "@/app/_components/ErrorFallback";

export default function MainError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[error boundary: (main)]", error);
        Sentry.captureException(error);
    }, [error]);

    return <ErrorFallback scope="this page" reset={reset} />;
}
