import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { useAppStore } from "@/store";
import { updateLastSeen } from "../services/user.service";

const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to track user activity by heartbeat updates to Firestore.
 * Throttled to prevent excessive writes.
 */
export function useActivityTracker() {
    const { user } = useAppStore();
    const pathname = usePathname();
    const lastUpdateRef = useRef<number>(0);

    useEffect(() => {
        if (!user) return;

        const now = Date.now();
        if (now - lastUpdateRef.current < THROTTLE_MS) return;

        // Perform throttled update
        lastUpdateRef.current = now;
        void updateLastSeen(user.uid).catch((err) => {
            console.warn("[ActivityTracker] Failed to update heartbeat:", err);
        });
    }, [user, pathname]); // Update on page change (throttled)
}
