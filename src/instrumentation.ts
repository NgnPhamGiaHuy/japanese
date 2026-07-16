import * as Sentry from "@sentry/nextjs";

/**
 * Server + edge runtime Sentry init. Prod-gated and DSN-gated: without
 * SENTRY_DSN set (no dev/CI credentials are available), this is a no-op in
 * every environment, and it never initializes outside production even when a
 * DSN is present.
 */
export async function register() {
    if (process.env.NODE_ENV !== "production" || !process.env.SENTRY_DSN) return;

    if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            tracesSampleRate: 1.0,
        });
    }
}

export const onRequestError = Sentry.captureRequestError;
