"use client";

import { useEffect, useState } from "react";

import { useAppStore } from "@/store";
import { subscribeNotifications } from "./notification.service";

import type { AppNotification } from "./types";

export function useNotifications() {
    const { user } = useAppStore();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            const t = setTimeout(() => {
                setNotifications([]);
                setLoading(false);
            }, 0);
            return () => clearTimeout(t);
        }

        const unsub = subscribeNotifications(
            user.uid,
            (updated) => {
                setNotifications(updated);
                setLoading(false);
            },
            () => setLoading(false),
        );

        return () => unsub();
    }, [user?.uid]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return { notifications, loading, unreadCount };
}
