import createNextIntlPlugin from "next-intl/plugin";

import { withSentryConfig } from "@sentry/nextjs";

import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            },
            {
                protocol: "https",
                hostname: "firebasestorage.googleapis.com",
            },
        ],
    },
};

// Source-map upload needs SENTRY_AUTH_TOKEN (org/project auth), which no
// dev/CI environment here has — disabled until real credentials exist so the
// build never attempts a network call it can't authenticate.
export default withSentryConfig(withNextIntl(nextConfig), {
    silent: true,
    sourcemaps: {
        disable: !process.env.SENTRY_AUTH_TOKEN,
    },
});
