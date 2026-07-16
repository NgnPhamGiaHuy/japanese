"use client";

import { useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import AdminProvider from "@/features/admin/context/AdminContext";
import { NotificationsProvider } from "@/features/notifications/context/NotificationsContext";
import { useActivityTracker, useFirebaseAuth } from "@/features/user/hooks";
import { useAppStore } from "@/lib/app-store";
import { AudioProvider } from "@/lib/AudioProvider";
import { FontSyncer } from "@/lib/FontSyncer";
import { PostHogProvider } from "@/lib/PostHogProvider";
import { AlertProvider } from "@/shared/providers";

function AuthGate({ children }: { children: React.ReactNode }) {
    const isAuthReady = useAppStore((s) => s.isAuthReady);

    if (!isAuthReady) {
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
        <QueryClientProvider client={queryClient}>
            <AlertProvider>
                <FontSyncer />
                <AudioProvider />
                <PostHogProvider />
                <AuthGate>
                    <AdminProvider>
                        <NotificationsProvider>{children}</NotificationsProvider>
                    </AdminProvider>
                </AuthGate>
            </AlertProvider>
        </QueryClientProvider>
    );
}
