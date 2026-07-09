"use client";

import { useEffect, useState } from "react";

import { onSnapshot } from "firebase/firestore";

import { useAppStore } from "@/lib/app-store";
import { userProgressLessonCol } from "../services/progress.service";

import type { UserCardProgress } from "../domain/types";
import type { DeckStatus } from "../utils/learningEngine";

const EMPTY_STATUS: DeckStatus = { newCount: 0, dueCount: 0, mistakeCount: 0, totalCount: 0 };

/**
 * Computes deck status (new/due/mistake/total counts) from only the current
 * user's progress subcollection plus the lesson's stored cardCount.
 *
 * @remarks
 * new/due/mistake are derived entirely from progress fields (repetitions,
 * nextReviewAt, isMistake) — full card content is never needed just to count
 * them, so this avoids subscribing to the (much larger) content collection.
 * A card with no progress doc yet is implicitly "new" (repetitions 0),
 * mirroring the synthesized fresh state used elsewhere.
 *
 * @param lessonId - Lesson to compute status for (empty string = skip)
 * @param cardCount - Lesson's stored total card count
 */
export function useDeckProgressStatus(lessonId: string, cardCount: number): DeckStatus {
    const { user } = useAppStore();
    const [status, setStatus] = useState<DeckStatus>(EMPTY_STATUS);

    useEffect(() => {
        if (!user || !lessonId) {
            setStatus(EMPTY_STATUS);
            return;
        }

        const unsub = onSnapshot(
            userProgressLessonCol(user.uid, lessonId),
            (snap) => {
                const now = Date.now();
                let dueCount = 0;
                let mistakeCount = 0;
                let studiedCount = 0;

                snap.docs.forEach((d) => {
                    const p = d.data() as UserCardProgress;
                    if (p.repetitions > 0) {
                        studiedCount++;
                        if (p.nextReviewAt <= now) dueCount++;
                    }
                    if (p.isMistake) mistakeCount++;
                });

                setStatus({
                    newCount: Math.max(0, cardCount - studiedCount),
                    dueCount,
                    mistakeCount,
                    totalCount: cardCount,
                });
            },
            (err) => {
                console.error("[useDeckProgressStatus] error:", err);
                setStatus(EMPTY_STATUS);
            },
        );

        return () => unsub();
    }, [user?.uid, lessonId, cardCount]);

    return status;
}
