import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { User } from "firebase/auth";

interface AppState {
    // Auth
    user: User | null;
    isAuthReady: boolean;

    // Settings
    useHandwriting: boolean;
    /** Gates every automatic pronunciation, in every mode. Manual replay is never gated. */
    globalAutoPlay: boolean;
    sfxMuted: boolean;
    voiceMuted: boolean;
    /** 0–1. */
    sfxVolume: number;
    /** 0–1. */
    voiceVolume: number;

    // Actions
    setUser: (user: User | null) => void;
    setAuthReady: (ready: boolean) => void;
    toggleHandwriting: () => void;
    toggleAutoPlay: () => void;
    toggleSfxMuted: () => void;
    toggleVoiceMuted: () => void;
    setSfxVolume: (value: number) => void;
    setVoiceVolume: (value: number) => void;
}

const clampVolume = (value: number): number => Math.min(Math.max(value, 0), 1);

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            user: null,
            isAuthReady: false,
            useHandwriting: false,
            globalAutoPlay: true,
            sfxMuted: false,
            voiceMuted: false,
            sfxVolume: 1,
            voiceVolume: 1,
            setUser: (user) => set({ user }),
            setAuthReady: (isAuthReady) => set({ isAuthReady }),
            toggleHandwriting: () => set((s) => ({ useHandwriting: !s.useHandwriting })),
            toggleAutoPlay: () => set((s) => ({ globalAutoPlay: !s.globalAutoPlay })),
            toggleSfxMuted: () => set((s) => ({ sfxMuted: !s.sfxMuted })),
            toggleVoiceMuted: () => set((s) => ({ voiceMuted: !s.voiceMuted })),
            setSfxVolume: (value) => set({ sfxVolume: clampVolume(value) }),
            setVoiceVolume: (value) => set({ voiceVolume: clampVolume(value) }),
        }),
        {
            name: "app-settings",
            // Only persist settings, never auth objects (Firebase manages that).
            // New keys are additive: existing users hydrate without them and fall back to the
            // defaults above, so no persisted-state migration is needed.
            partialize: (s) => ({
                useHandwriting: s.useHandwriting,
                globalAutoPlay: s.globalAutoPlay,
                sfxMuted: s.sfxMuted,
                voiceMuted: s.voiceMuted,
                sfxVolume: s.sfxVolume,
                voiceVolume: s.voiceVolume,
            }),
        },
    ),
);
