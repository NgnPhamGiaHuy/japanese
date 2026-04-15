import { getAI, GoogleAIBackend } from "firebase/ai";
import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
    initializeFirestore,
    persistentLocalCache,
    persistentSingleTabManager,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

/**
 * Firestore with persistent local cache (IndexedDB).
 *
 * Why this matters for real-time notifications:
 * - The default Firestore instance uses an in-memory cache. When the tab
 *   loses focus or the network briefly drops, the WebSocket reconnects and
 *   re-fetches everything from the server — causing a visible delay.
 * - persistentLocalCache keeps a local IndexedDB copy. onSnapshot listeners
 *   fire immediately from cache, then again when the server confirms the
 *   latest state. Recipients see new notifications the instant the tab
 *   regains focus, with no round-trip delay.
 * - persistentSingleTabManager is correct for a standard web app (one tab
 *   owns the IndexedDB lock). Use persistentMultipleTabManager if you need
 *   multi-tab sync.
 */
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager({ forceOwnership: false }),
    }),
});

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const APP_ID = process.env.NEXT_PUBLIC_APP_ID ?? "kana-nihongo-master";

/**
 * Firebase AI Logic instance using the Google AI (Gemini Developer) backend.
 * Authentication is handled transparently by Firebase — no API key is exposed.
 */
export const firebaseAI = getAI(app, { backend: new GoogleAIBackend() });
