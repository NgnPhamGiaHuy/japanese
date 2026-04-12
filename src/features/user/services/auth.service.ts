import { signOut as firebaseSignOut, signInWithPopup } from "firebase/auth";

import { auth, googleProvider } from "@/lib/firebase";
import { clearAuthCookie, setAuthCookie } from "@/shared/utils/cookie";

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
 */
export async function signOut(): Promise<void> {
    clearAuthCookie();
    await firebaseSignOut(auth);
}

/** Returns the currently signed-in Firebase user, or null. */
export function getCurrentUser(): User | null {
    return auth.currentUser;
}
