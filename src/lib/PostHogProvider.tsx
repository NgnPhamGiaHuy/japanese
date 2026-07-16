"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { initPostHog, posthog } from "@/lib/posthog";

/** Manual $pageview capture on route change — see posthog.ts for init gating. */
export function PostHogProvider() {
    const pathname = usePathname();

    useEffect(() => {
        initPostHog();
    }, []);

    useEffect(() => {
        if (process.env.NODE_ENV !== "production" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
        posthog.capture("$pageview", { $current_url: pathname });
    }, [pathname]);

    return null;
}
