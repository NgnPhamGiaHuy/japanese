import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { User } from "firebase/auth";

interface AppState {
    // Auth
    user: User | null;
    isAuthReady: boolean;
    // Settings
    useHandwriting: boolean;
    globalAutoPlay: boolean;
    // Actions
    setUser: (user: User | null) => void;
    setAuthReady: (ready: boolean) => void;
    toggleHandwriting: () => void;
    toggleAutoPlay: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            user: null,
            isAuthReady: false,
            useHandwriting: false,
            globalAutoPlay: true,
            setUser: (user) => set({ user }),
            setAuthReady: (isAuthReady) => set({ isAuthReady }),
            toggleHandwriting: () => set((s) => ({ useHandwriting: !s.useHandwriting })),
            toggleAutoPlay: () => set((s) => ({ globalAutoPlay: !s.globalAutoPlay })),
        }),
        {
            name: "app-settings",
            // Only persist settings, never auth objects (Firebase manages that)
            partialize: (s) => ({
                useHandwriting: s.useHandwriting,
                globalAutoPlay: s.globalAutoPlay,
            }),
        },
    ),
);
