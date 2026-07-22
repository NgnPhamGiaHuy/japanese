/**
 * @file lesson-paths
 * Firestore path helpers + the share-ID re-export for lessons — split out
 * of lesson.service.ts (E11-T3).
 */
import { collection, doc } from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import { encodeShareId as buildShareId } from "../utils/shareToken";

export { buildShareId };

export function lessonsCol(userId: string) {
    return collection(db, "artifacts", APP_ID, "users", userId, "lessons");
}

export function lessonDoc(userId: string, lessonId: string) {
    return doc(db, "artifacts", APP_ID, "users", userId, "lessons", lessonId);
}
