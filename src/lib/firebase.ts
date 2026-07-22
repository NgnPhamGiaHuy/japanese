import { connectFirestoreEmulator, getFirestore } from "@firebase/firestore";
import { getAI, GoogleAIBackend } from "firebase/ai";
import { getApps, initializeApp } from "firebase/app";
import {
    connectAuthEmulator,
    getAuth,
    GoogleAuthProvider,
    signInWithCustomToken,
} from "firebase/auth";
import { getStorage } from "firebase/storage";

import { APP_ID } from "./app-id";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Singleton Firebase app — safe to import from any module */
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export { APP_ID };

// ─── Emulator wiring (E2E only) ────────────────────────────────────────────
//
// Never active by default. Requires BOTH an explicit opt-in env var AND a
// non-production NODE_ENV, so a misconfigured env var can never point a real
// deployment at emulator hosts. Set by playwright.config.ts's webServer env,
// never by .env/.env.local. connectXEmulator() throws if called twice on the
// same instance (e.g. Next.js Fast Refresh re-running this module) — guarded
// with a module-scope flag rather than try/catch, so a real second-call bug
// still surfaces instead of being silently swallowed.
let emulatorsConnected = false;
if (
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" &&
    process.env.NODE_ENV !== "production" &&
    !emulatorsConnected
) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    emulatorsConnected = true;

    // Test-only sign-in bridge: the login screen only offers a Google-OAuth
    // popup, which E2E can't drive reliably. e2e/helpers/emulator-auth.ts
    // mints a custom token via the Admin SDK against the SAME Auth emulator;
    // the test calls this to sign in, exercising the real onIdTokenChanged →
    // createSessionAction (mints the httpOnly session cookie, ADR-107) →
    // proxy.ts pipeline exactly as a real sign-in would, without needing real
    // Google credentials. Only ever defined inside this already double-gated
    // block.
    if (typeof window !== "undefined") {
        (
            window as typeof window & { __e2eSignIn?: (customToken: string) => Promise<void> }
        ).__e2eSignIn = async (customToken: string) => {
            await signInWithCustomToken(auth, customToken);
        };
    }
}

/**
 * Firebase AI Logic instance using the Google AI (Gemini Developer) backend.
 * Authentication is handled transparently by Firebase — no API key is exposed.
 */
export const firebaseAI = getAI(app, { backend: new GoogleAIBackend() });
