"use server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { ActivityAction } from "@/lib/logging/actions.enum";
import { persistSystemLog } from "@/lib/logging/server";

const LOGIN_SESSION_COLLECTION = "login_sessions";
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface LoginMetadata {
    uid: string;
    displayName?: string;
    email?: string;
    provider: string;
}

/**
 * Server-side logout logging.
 * 
 * Logs user logout and clears the session tracking.
 */
export async function logUserLogout(
    idToken: string,
    uid: string,
): Promise<{ logged: boolean }> {
    try {
        // Verify token
        const decoded = await adminAuth.verifyIdToken(idToken);
        if (decoded.uid !== uid) {
            return { logged: false };
        }

        // Clear session
        const sessionRef = adminDb
            .collection(LOGIN_SESSION_COLLECTION)
            .doc(uid);
        
        await sessionRef.delete();

        // Log logout
        await persistSystemLog({
            action: ActivityAction.LOGOUT,
            entityType: "auth",
            entityId: uid,
            userId: uid,
            level: "info",
            source: "client",
            metadata: {
                logType: "AUTH",
            },
        });

        return { logged: true };
    } catch (error) {
        console.error("[AuthLogging] Failed to log logout:", error);
        return { logged: false };
    }
}

/**
 * Server-side login logging with deduplication.
 * 
 * **Problem:** Firebase auth listeners fire on:
 * - Initial sign-in ✓ (should log)
 * - Token refresh (~every 1 hour) ✗ (should NOT log)
 * - React Strict Mode remounts ✗ (should NOT log)
 * - Navigation/page refresh ✗ (should NOT log)
 * - Multiple tabs ✓ (each tab = separate session, should log)
 * 
 * **Solution:** Server-side session tracking with Firestore transactions
 * - Tracks last login timestamp per user in Firestore
 * - Uses transaction to prevent race conditions
 * - Only logs if >30 minutes since last login
 * - Atomic check-and-set prevents duplicates even with concurrent requests
 * 
 * **Why server-side?**
 * - Client-side guards (module vars, sessionStorage) fail on navigation/remounts
 * - Server-side is the single source of truth
 * - Firestore transactions guarantee atomicity
 * 
 * @param idToken - Firebase ID token for authentication
 * @param metadata - User metadata for logging
 * @returns Promise with logged status
 */
export async function logUserLogin(
    idToken: string,
    metadata: LoginMetadata,
): Promise<{ logged: boolean }> {
    try {
        // Verify token
        const decoded = await adminAuth.verifyIdToken(idToken);
        if (decoded.uid !== metadata.uid) {
            return { logged: false };
        }

        const sessionRef = adminDb
            .collection(LOGIN_SESSION_COLLECTION)
            .doc(metadata.uid);

        // Use transaction to prevent race conditions
        const result = await adminDb.runTransaction(async (transaction) => {
            const sessionDoc = await transaction.get(sessionRef);
            const now = Date.now();

            if (sessionDoc.exists) {
                const lastLogin = sessionDoc.data()?.timestamp || 0;
                const timeSinceLastLogin = now - lastLogin;

                // If last login was within session duration, skip logging
                if (timeSinceLastLogin < SESSION_DURATION_MS) {
                    return { shouldLog: false };
                }
            }

            // Update session timestamp
            transaction.set(sessionRef, {
                timestamp: now,
                uid: metadata.uid,
            });

            return { shouldLog: true };
        });

        // Log only if transaction determined we should
        if (result.shouldLog) {
            await persistSystemLog({
                action: ActivityAction.LOGIN,
                entityType: "auth",
                entityId: metadata.uid,
                userId: metadata.uid,
                level: "info",
                source: "client",
                metadata: {
                    logType: "AUTH",
                    userName: metadata.displayName,
                    userEmail: metadata.email,
                    provider: metadata.provider,
                },
            });

            return { logged: true };
        }

        return { logged: false };
    } catch (error) {
        // Silently fail - logging should never block auth
        console.error("[AuthLogging] Failed to log login:", error);
        return { logged: false };
    }
}
