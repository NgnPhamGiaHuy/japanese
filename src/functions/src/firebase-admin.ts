/**
 * @file firebase-admin.ts
 * Admin SDK init for the functions package. Cloud Functions 2nd gen
 * initializes eagerly at cold start — unlike the Next.js app's
 * lib/firebase-admin.ts, there's no build-time module-eval concern here, so
 * this skips that file's lazy-proxy pattern and just initializes directly.
 */
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
    initializeApp();
}

export const db = getFirestore();
