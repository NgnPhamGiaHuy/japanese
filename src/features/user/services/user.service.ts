import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import { INITIAL_USER_DATA } from "../types/user.types";

import type { UserData } from "../types/user.types";

const userDoc = (userId: string) => doc(db, "artifacts", APP_ID, "users", userId);

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

export const updateUserProgress = async (
    userId: string,
    updateFn: (prev: UserData) => UserData,
): Promise<void> => {
    const ref = userDoc(userId);
    const snap = await getDoc(ref);
    const prev = snap.exists()
        ? ({ ...INITIAL_USER_DATA, ...snap.data().progress } as UserData)
        : INITIAL_USER_DATA;

    const next = updateFn(prev);
    await setDoc(ref, { progress: next }, { merge: true });
};
