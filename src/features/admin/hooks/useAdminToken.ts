"use client";

import { useCallback } from "react";

import { useAppStore } from "@/lib/app-store";

export function useAdminToken() {
    const user = useAppStore((s) => s.user);
    return useCallback(async () => {
        if (!user) throw new Error("Not authenticated");
        return user.getIdToken();
    }, [user]);
}
