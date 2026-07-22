import {
    signOut as firebaseSignOut,
    getRedirectResult,
    signInWithPopup,
    signInWithRedirect,
} from "firebase/auth";

import { auth, googleProvider } from "@/lib/firebase";
import { ActivityAction } from "@/lib/logging/actions.enum";
import { enqueueClientLog } from "@/lib/logging/browser";
import { logUserLogin, logUserLogout } from "./auth-logging.service";
import { createSessionAction, revokeSessionAction } from "../actions/session.actions";

import type { User } from "firebase/auth";

/**
 * Mints the httpOnly session cookie (ADR-107) for the signed-in Firebase
 * user via a server round-trip — the client never writes this cookie
 * directly (it can't; httpOnly cookies aren't reachable from page JS).
 */
async function persistSignedInUser(user: User): Promise<User> {
    const token = await user.getIdToken();
    const result = await createSessionAction(token);
    if (!result.ok) {
        console.error("[auth.service] createSessionAction failed:", result.error);
        enqueueClientLog(() => user.getIdToken(), {
            action: ActivityAction.SESSION_MINT_FAILED,
            entityType: "auth",
            entityId: user.uid,
            level: "error",
            metadata: { source: "persistSignedInUser", error: result.error },
        });
    }

    // Explicitly log login (in addition to hook listener for immediate feedback)
    logUserLogin(token, {
        uid: user.uid,
        displayName: user.displayName ?? undefined,
        email: user.email ?? undefined,
        provider: user.providerData[0]?.providerId ?? "google.com",
    }).catch((err) => {
        console.error("[auth.service] logUserLogin failed:", err);
        enqueueClientLog(() => user.getIdToken(), {
            action: ActivityAction.LOGIN_LOG_FAILED,
            entityType: "auth",
            entityId: user.uid,
            level: "error",
            metadata: { source: "signInWithGoogle", error: String(err) },
        });
    });

    return user;
}

/**
 * Opens the Google OAuth popup and mints the server-side session cookie.
 * Firebase handles session persistence in localStorage/IndexedDB;
 * the httpOnly cookie is used by Next.js `proxy` for route protection
 * (presence only) and by admin actions (real, server-side verification).
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
 * Signs the current user out: revokes the session server-side (so a copied
 * cookie value stops verifying immediately, not merely on natural expiry)
 * and clears the cookie, so the proxy redirects on the next navigation.
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
    await revokeSessionAction();
    await firebaseSignOut(auth);
}
