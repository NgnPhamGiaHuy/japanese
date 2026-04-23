import { signOut as firebaseSignOut, signInWithPopup } from "firebase/auth";

import { auth, googleProvider } from "@/lib/firebase";
import { clearAuthCookie, setAuthCookie } from "@/shared/utils";
import { logUserLogin, logUserLogout } from "./auth-logging.service";

import type { User } from "firebase/auth";

/**
 * Opens the Google OAuth popup and persists the ID token in a cookie.
 * Firebase handles session persistence in localStorage/IndexedDB;
 * the cookie is used exclusively by Next.js `proxy` for route protection.
 * 
 * Login logging is handled by useFirebaseAuth hook via onIdTokenChanged listener.
 */
export async function signInWithGoogle(): Promise<User> {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    setAuthCookie(token);
    
    // Explicitly log login (in addition to hook listener for immediate feedback)
    logUserLogin(token, {
        uid: result.user.uid,
        displayName: result.user.displayName ?? undefined,
        email: result.user.email ?? undefined,
        provider: result.user.providerData[0]?.providerId ?? "google.com",
    }).catch(() => {});
    
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
            // Use server-side logout logging
            await logUserLogout(token, currentUser.uid);
        } catch {
            // Non-blocking
        }
    }
    clearAuthCookie();
    await firebaseSignOut(auth);
}
