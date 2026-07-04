"use client";

import { useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import AdminProvider from "@/features/admin/context/AdminContext";
import { NotificationsProvider } from "@/features/notifications/NotificationsContext";
import { useActivityTracker, useFirebaseAuth } from "@/features/user/hooks";
import { useAppStore } from "@/lib/app-store";
import { FontSyncer } from "@/lib/FontSyncer";
import { AlertProvider } from "@/shared/providers";

function AuthGate({ children }: { children: React.ReactNode }) {
    const isAuthReady = useAppStore((s) => s.isAuthReady);

    if (!isAuthReady) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-bg">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 -rotate-6 items-center justify-center rounded-3xl border-b-4 border-katakana-strong bg-gradient-to-br from-katakana to-both text-3xl text-white shadow-sm">
                        あ
                    </div>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full w-1/2 animate-[slide_1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-katakana to-both" />
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
                <AuthGate>
                    <AdminProvider>
                        <NotificationsProvider>{children}</NotificationsProvider>
                    </AdminProvider>
                </AuthGate>
            </AlertProvider>
        </QueryClientProvider>
    );
}
