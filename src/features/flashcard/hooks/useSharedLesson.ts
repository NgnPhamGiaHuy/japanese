import { useEffect, useState } from "react";

import { useAppStore } from "@/store";
import { getSharedLesson } from "../services";

import type { SharedLessonResult } from "../services";

export function useSharedLesson(shareId: string) {
    const { user } = useAppStore();
    const [result, setResult] = useState<SharedLessonResult | null>(null);
    const [status, setStatus] = useState<"loading" | "not_found" | "ready">("loading");

    useEffect(() => {
        if (!shareId) return;

        getSharedLesson(shareId, user?.uid)
            .then((res) => {
                if (!res) setStatus("not_found");
                else {
                    setResult(res);
                    setStatus("ready");
                }
            })
            .catch(() => setStatus("not_found"));
    }, [shareId, user?.uid]);

    return { result, status };
}
