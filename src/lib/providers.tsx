"use client";

import { useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion } from "motion/react";

import AdminProvider from "@/features/admin/context/AdminContext";
import { CommandPaletteLauncher } from "@/features/command-palette";
import { NotificationsProvider } from "@/features/notifications/context/NotificationsContext";
import { useActivityTracker, useFirebaseAuth } from "@/features/user/hooks";
import { usePathname } from "@/i18n/navigation";
import { useAppStore } from "@/lib/app-store";
import { AudioProvider } from "@/lib/AudioProvider";
import { FontSyncer } from "@/lib/FontSyncer";
import { PostHogProvider } from "@/lib/PostHogProvider";
import { AlertProvider } from "@/shared/providers";

// Public/crawlable routes that must render immediately, never behind the
// client-only auth-ready splash — otherwise their server-rendered content
// (e.g. the shared-deck SEO preview) never reaches a non-JS crawler, since
// isAuthReady can never be true during SSR. Mirrors proxy.ts's public-path
// allowlist; every other route keeps the existing splash-until-ready gate.
const PUBLIC_ROUTE_PATTERNS = [/^\/flashcard\/shared\/[^/]+$/];

function AuthGate({ children }: { children: React.ReactNode }) {
    const isAuthReady = useAppStore((s) => s.isAuthReady);
    const pathname = usePathname();
    const isPublicRoute = PUBLIC_ROUTE_PATTERNS.some((re) => re.test(pathname));

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
                            <NotificationsProvider>
                                {children}
                                <CommandPaletteLauncher />
                            </NotificationsProvider>
                        </AdminProvider>
                    </AuthGate>
                </AlertProvider>
            </QueryClientProvider>
        </LazyMotion>
    );
}
