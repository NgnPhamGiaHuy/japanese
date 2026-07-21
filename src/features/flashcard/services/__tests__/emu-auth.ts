import { signInWithCustomToken, signOut } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

import type { User } from "firebase/auth";

/**
 * @file __tests__/emu-auth.ts
 * Emulator test harness for the flashcard data services.
 *
 * @remarks
 * Unlike notifications' `__tests__/harness.ts` (which hands each test an
 * injected, rules-scoped `Firestore` via `@firebase/rules-unit-testing`),
 * none of `saveLessonWithCards` / `card.service` / `comment.service` /
 * `access.service` accept a `db` override — they all close over the ambient
 * singleton exported by `@/lib/firebase`. The only way to exercise them
 * under the real security rules is to give that ambient `auth` singleton a
 * real, signed-in session and let `db` ride along — so this harness signs
 * into the Auth emulator via a minted custom token (same mechanism as
 * `e2e/helpers/emulator-auth.ts`) instead of injecting a separate instance.
 *
 * The emulator hosts multiple projects as separate logical namespaces keyed
 * by project ID. The ambient client `db`/`auth` singletons connect using
 * `NEXT_PUBLIC_FIREBASE_PROJECT_ID` ("demo-emu-test", set by
 * vitest.emu.config.ts). `@/lib/firebase-admin`'s lazy init checks
 * `GCLOUD_PROJECT` FIRST — `firebase emulators:exec` sets that to whatever
 * project the CLI is actually linked to (e.g. a real project ID from `firebase
 * login`/`firebase use`, verified empirically — NOT a "demo-*" placeholder),
 * so without this override `adminDb` and the client `db` silently write to
 * two different namespaces in the same emulator: writes via one are
 * invisible to reads via the other, no error either side. Forcing this
 * before `adminAuth`/`adminDb` are first touched (their init is lazy — see
 * firebase-admin.ts's lazyProxy) keeps both SDKs in the same namespace.
 */
process.env.GCLOUD_PROJECT = "demo-emu-test";

export const RUN =
    !!process.env.FIRESTORE_EMULATOR_HOST && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

/**
 * Ensures `uid` exists in the Auth emulator and signs the ambient client
 * `auth` singleton in as them — subsequent calls into `db`-closing-over
 * service functions run with `request.auth.uid === uid` for the real
 * firestore.rules to evaluate. Establishes the AMBIENT SESSION only.
 *
 * @remarks
 * The returned `User` is what a custom-token sign-in actually produces in
 * this SDK/emulator combination: `email`/`displayName` come back `null`
 * (verified empirically — even `reload()` doesn't populate them here),
 * regardless of what `createUser` set on the account record. Rules-facing
 * authorization only ever depends on `request.auth.uid`, which IS correct,
 * so this is harmless for that purpose. But a caller that needs to pass a
 * `User`-shaped value carrying real `email`/`displayName` into a function
 * under test (e.g. `syncInviteToCollaborator`) should build its own plain
 * object with those fields set explicitly, rather than trust this return
 * value's profile fields.
 */
export async function signInAs(uid: string, email?: string, displayName?: string): Promise<User> {
    try {
        await adminAuth.createUser({ uid, email, displayName });
    } catch (err) {
        if ((err as { code?: string }).code !== "auth/uid-already-exists") throw err;
    }
    const customToken = await adminAuth.createCustomToken(uid);
    const credential = await signInWithCustomToken(auth, customToken);
    return credential.user;
}

export async function signOutUser(): Promise<void> {
    await signOut(auth);
}

/** Deletes every doc under the given Admin-SDK collection paths (test cleanup). */
export async function wipeCollections(...paths: string[]): Promise<void> {
    for (const path of paths) {
        const snap = await adminDb.collection(path).get();
        await Promise.all(snap.docs.map((d) => d.ref.delete()));
    }
}

/** Deletes a single doc by path via the Admin SDK (bypasses rules). */
export async function wipeDoc(path: string): Promise<void> {
    await adminDb.doc(path).delete();
}
