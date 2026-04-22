import { signOut as firebaseSignOut, signInWithPopup } from "firebase/auth";

import { auth, googleProvider } from "@/lib/firebase";
import { ActivityAction } from "@/lib/logging/actions.enum";
import { enqueueClientLog } from "@/lib/logging/browser";
import { clearAuthCookie, setAuthCookie } from "@/shared/utils";

import type { User } from "firebase/auth";

/**
 * Opens the Google OAuth popup and persists the ID token in a cookie.
 * Firebase handles session persistence in localStorage/IndexedDB;
 * the cookie is used exclusively by Next.js `proxy` for route protection.
 */
export async function signInWithGoogle(): Promise<User> {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    setAuthCookie(token);
    return result.user;
}

/**
 * Signs the current user out and removes the auth cookie so the proxy
 * redirects immediately on the next navigation.
 * Logs the logout event before clearing the session.
 */
export async function signOut(): Promise<void> {
    const currentUser = auth.currentUser;
    if (currentUser) {
        try {
            const token = await currentUser.getIdToken();
            enqueueClientLog(() => Promise.resolve(token), {
                action: ActivityAction.LOGOUT,
                entityType: "auth",
                entityId: currentUser.uid,
                level: "info",
                metadata: {
                    logType: "AUTH",
                    userName: currentUser.displayName ?? undefined,
                    userEmail: currentUser.email ?? undefined,
                },
            });
        } catch {
            // Non-blocking
        }
    }
    clearAuthCookie();
    await firebaseSignOut(auth);
}
