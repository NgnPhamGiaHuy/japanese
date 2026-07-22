"use client";

import { useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion } from "motion/react";

import { AdminProvider } from "@/features/admin";
import { CommandPaletteLauncher } from "@/features/command-palette";
import { registerFlashcardNotificationActions } from "@/features/flashcard";
import { NotificationsProvider } from "@/features/notifications";
import { useActivityTracker, useFirebaseAuth, UserProgressProvider } from "@/features/user";
import { usePathname } from "@/i18n/navigation";
import { useAppStore } from "@/lib/app-store";
import { AudioProvider } from "@/lib/AudioProvider";
import { FontSyncer } from "@/lib/FontSyncer";
import { PostHogProvider } from "@/lib/PostHogProvider";
import { isPublicForRender } from "@/shared/constants/public-routes";
import { AlertProvider } from "@/shared/providers";

// Producing features register their notification action handlers here, at
// module scope, so registration is complete before any inbox render can look
// one up. This is the composition root ADR-102's seam expects; the inbox
// itself never imports a producing feature. A kind whose handler is missing
// degrades visibly and reports — see the registry's resolve path.
registerFlashcardNotificationActions();

function AuthGate({ children }: { children: React.ReactNode }) {
    const isAuthReady = useAppStore((s) => s.isAuthReady);
    const pathname = usePathname();

    // Public routes render immediately rather than behind the client-only
    // auth-ready splash — otherwise server-rendered content (e.g. the
    // shared-deck SEO preview) never reaches a non-JS crawler, since
    // isAuthReady can never be true during SSR.
    //
    // This used to be a local regex list whose comment claimed to mirror
    // proxy.ts. It did not: the proxy admitted /login, sitemap, robots and the
    // OG-image pattern, this list admitted only the shared-deck landing page.
    // Both now derive from one source (T-118a), so the claim is structural
    // rather than aspirational.
    //
    // Reconciliation of the two previously-unequal sets:
    //   /login              → NOW HONORED HERE. The one page guaranteed to be
    //                         viewed signed-out no longer flashes the splash
    //                         first. Safe because the login page manages its
    //                         own redirect and never reads isAuthReady.
    //   /sitemap.xml        → not applicable: never rendered through React.
    //   /robots.txt         → not applicable: never rendered through React.
    //   .../opengraph-image → not applicable: file-convention image route.
    //   shared-deck landing → unchanged; both consumers already admitted it.
    // The three "not applicable" entries are excluded by the `asset` kind in
    // the shared list — by design, not by omission. Nothing else moves between
    // public, splash-gated and redirected.
    const isPublicRoute = isPublicForRender(pathname);

    if (!isAuthReady && !isPublicRoute) {
        return (
            <div className="bg-bg fixed inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="border-katakana-strong from-katakana to-both flex h-16 w-16 -rotate-6 items-center justify-center rounded-3xl border-b-4 bg-gradient-to-br text-3xl text-white shadow-sm">
                        あ
                    </div>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
                        <div className="from-katakana to-both h-full w-1/2 animate-[slide_1s_ease-in-out_infinite] rounded-full bg-gradient-to-r" />
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

/** Client-side shell that initialises Firebase auth and wraps the app */
export function Providers({ children }: { children: React.ReactNode }) {
    useFirebaseAuth();
    useActivityTracker();
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30_000,
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                    mutations: {
                        retry: 1,
                    },
                },
            }),
    );

    return (
        // features is a dynamic import() (not a static top-level import of
        // lib/motionFeatures) so the bundler code-splits domMax into its own
        // chunk, fetched only once LazyMotion mounts client-side — the
        // synchronous `features={domMax}` form measured byte-identical to the
        // unshaken `motion.*` import under Turbopack (E11-T1's commit
        // message), since it still bundles domMax into this same chunk.
        // strict: throws if a bare `motion.*` component renders here instead
        // of `m.*` — a guardrail against reintroducing that unshaken import.
        <LazyMotion
            features={() => import("@/lib/motionFeatures").then((mod) => mod.default)}
            strict
        >
            <QueryClientProvider client={queryClient}>
                <AlertProvider>
                    <FontSyncer />
                    <AudioProvider />
                    <PostHogProvider />
                    <AuthGate>
                        <AdminProvider>
                            <UserProgressProvider>
                                <NotificationsProvider>
                                    {children}
                                    <CommandPaletteLauncher />
                                </NotificationsProvider>
                            </UserProgressProvider>
                        </AdminProvider>
                    </AuthGate>
                </AlertProvider>
            </QueryClientProvider>
        </LazyMotion>
    );
}
