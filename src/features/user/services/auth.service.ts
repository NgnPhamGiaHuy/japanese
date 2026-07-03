import {
    signOut as firebaseSignOut,
    getRedirectResult,
    signInWithPopup,
    signInWithRedirect,
} from "firebase/auth";

import { auth, googleProvider } from "@/lib/firebase";
import { clearAuthCookie, setAuthCookie } from "@/shared/utils";
import { logUserLogin, logUserLogout } from "./auth-logging.service";

import type { User } from "firebase/auth";

/**
 * Persists the signed-in Firebase user in the route-guard cookie.
 */
async function persistSignedInUser(user: User): Promise<User> {
    const token = await user.getIdToken();
    setAuthCookie(token);

    // Explicitly log login (in addition to hook listener for immediate feedback)
    logUserLogin(token, {
        uid: user.uid,
        displayName: user.displayName ?? undefined,
        email: user.email ?? undefined,
        provider: user.providerData[0]?.providerId ?? "google.com",
    }).catch(() => {});

    return user;
}

/**
 * Opens the Google OAuth popup and persists the ID token in a cookie.
 * Firebase handles session persistence in localStorage/IndexedDB;
 * the cookie is used exclusively by Next.js `proxy` for route protection.
 *
 * Login logging is handled by useFirebaseAuth hook via onIdTokenChanged listener.
 */
export async function signInWithGoogle(): Promise<User> {
    const result = await signInWithPopup(auth, googleProvider);
    return persistSignedInUser(result.user);
}

export async function signInWithGoogleRedirect(): Promise<void> {
    await signInWithRedirect(auth, googleProvider);
}

export async function completeGoogleRedirectSignIn(): Promise<User | null> {
    const result = await getRedirectResult(auth);
    if (!result?.user) return null;
    return persistSignedInUser(result.user);
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
