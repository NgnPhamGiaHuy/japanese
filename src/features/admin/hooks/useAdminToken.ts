"use client";

import { useAppStore } from "@/store";

export function useAdminToken() {
    const user = useAppStore((s) => s.user);
    return async () => {
        if (!user) throw new Error("Not authenticated");
        return user.getIdToken();
    };
}
