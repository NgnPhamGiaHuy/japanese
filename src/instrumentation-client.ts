import * as Sentry from "@sentry/nextjs";

/**
 * Browser Sentry init. Prod-gated and DSN-gated (see instrumentation.ts for
 * the server/edge counterpart). Session Replay masks all text/inputs and
 * blocks all media by default so no PII ever leaves the browser in a replay.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (process.env.NODE_ENV === "production" && dsn) {
    Sentry.init({
        dsn,
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        integrations: [
            Sentry.replayIntegration({
                maskAllText: true,
                maskAllInputs: true,
                blockAllMedia: true,
            }),
        ],
    });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
