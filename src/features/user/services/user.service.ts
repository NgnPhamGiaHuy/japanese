import { doc, onSnapshot, runTransaction, setDoc } from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import { INITIAL_USER_DATA } from "../types";

import type { Firestore } from "firebase/firestore";
import type { UserData } from "../types";

const userDoc = (userId: string, firestoreDb: Firestore = db) =>
    doc(firestoreDb, "artifacts", APP_ID, "users", userId);

export const subscribeUserProgress = (
    userId: string,
    onUpdate: (data: UserData) => void,
    onError?: (err: Error) => void,
) => {
    return onSnapshot(
        userDoc(userId),
        (snap) => {
            if (snap.exists()) {
                onUpdate({ ...INITIAL_USER_DATA, ...snap.data().progress } as UserData);
            } else {
                onUpdate(INITIAL_USER_DATA);
            }
        },
        (err) => {
            console.error("[UserService] Error subscribing to progress:", err);
            onError?.(err);
        },
    );
};

/**
 * Reads, transforms, and writes back a user's progress atomically.
 *
 * @remarks
 * Runs as a Firestore transaction — `setDoc(..., {merge: true})` on a plain
 * `getDoc` read does NOT deep-merge the nested `progress` object, so two
 * concurrent callers (e.g. addXP and completedLesson firing back-to-back,
 * unawaited, from the same study-session completion) could otherwise race:
 * whichever write lands second silently overwrites the other's change.
 */
export const updateUserProgress = async (
    userId: string,
    updateFn: (prev: UserData) => UserData,
    firestoreDb: Firestore = db,
): Promise<void> => {
    const ref = userDoc(userId, firestoreDb);
    await runTransaction(firestoreDb, async (transaction) => {
        const snap = await transaction.get(ref);
        const prev = snap.exists()
            ? ({ ...INITIAL_USER_DATA, ...snap.data().progress } as UserData)
            : INITIAL_USER_DATA;

        const next = updateFn(prev);
        transaction.set(
            ref,
            { progress: next, lastSeenAt: new Date().toISOString() },
            { merge: true },
        );
    });
};

export const updateLastSeen = async (userId: string): Promise<void> => {
    const ref = userDoc(userId);
    await setDoc(ref, { lastSeenAt: new Date().toISOString() }, { merge: true });
};
