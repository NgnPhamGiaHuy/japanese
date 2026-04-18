"use client";

import { useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { NotificationsProvider } from "@/features/notifications";
import { useActivityTracker, useFirebaseAuth } from "@/features/user/hooks";
import { FontSyncer } from "@/lib/FontSyncer";
import AdminProvider from "@/features/admin/context/AdminContext";
import { AlertProvider } from "@/shared/providers";
import { useAppStore } from "@/store";

function AuthGate({ children }: { children: React.ReactNode }) {
    const isAuthReady = useAppStore((s) => s.isAuthReady);

    if (!isAuthReady) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 -rotate-6 items-center justify-center rounded-[1.5rem] border-b-4 border-[#1899d6] bg-gradient-to-br from-[#1cb0f6] to-[#ce82ff] text-3xl text-white shadow-sm">
                        あ
                    </div>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full w-1/2 animate-[slide_1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#1cb0f6] to-[#ce82ff]" />
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
