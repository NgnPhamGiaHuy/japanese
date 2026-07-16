/**
 * @file e2e/helpers/emulator-firestore.ts
 * Seeds documents directly into the Firestore EMULATOR (via the Admin SDK) so
 * a realtime-journey test can prove a server-side change reaches the UI
 * through the app's own `onSnapshot` listeners, without needing to drive an
 * entire creation flow (e.g. AI deck generation) through the browser.
 *
 * SAFETY: same guard as emulator-auth.ts — refuses to run unless
 * FIRESTORE_EMULATOR_HOST is set, so this can never write to real Firestore.
 */
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initE2EFirestore() {
    if (!getApps().length) {
        if (!process.env.FIRESTORE_EMULATOR_HOST) {
            throw new Error(
                "[e2e] FIRESTORE_EMULATOR_HOST is not set. Refusing to initialize the Admin SDK — " +
                    "E2E Firestore helpers must never be able to reach real Firestore.",
            );
        }
        initializeApp({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID ?? "demo-e2e" });
    }
    return getFirestore();
}

// Matches src/lib/firebase.ts's default (no NEXT_PUBLIC_APP_ID set in E2E env).
const APP_ID = "kana-nihongo-master";

/**
 * Writes a notification document straight to the emulator, mirroring the
 * shape `emitNotificationAction` would produce, so `subscribeNotifications`'s
 * onSnapshot listener picks it up exactly as it would for a real event.
 */
export async function seedNotification(
    userId: string,
    overrides: { title: string; message: string },
): Promise<string> {
    const db = initE2EFirestore();
    const ref = db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("users")
        .doc(userId)
        .collection("notifications")
        .doc();

    await ref.set({
        userId,
        type: "invite",
        title: overrides.title,
        message: overrides.message,
        status: "unread",
        isDeleted: false,
        senderId: "e2e-sender",
        senderName: "E2E Sender",
        createdAt: Date.now(),
    });

    return ref.id;
}
