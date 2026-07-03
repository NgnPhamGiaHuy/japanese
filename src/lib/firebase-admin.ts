import "server-only";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

/**
 * Initializes the Admin SDK app, reusing an existing instance if present.
 *
 * Called lazily (see `lazyProxy`) so `initializeApp`/`cert` never run at module
 * load. Module-scope init previously required live service-account credentials
 * at build time, crashing any CI/build without secrets. The Admin SDK is only
 * needed inside a request (server action / server component), so deferring init
 * to first use keeps builds credential-free.
 */
function getAdminApp(): App {
    return getApps().length > 0
        ? getApp()
        : initializeApp({
              credential: cert({
                  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
              }),
          });
}

let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;

/**
 * Wraps a lazily-resolved SDK singleton in a Proxy so consumers keep the
 * value-style API (`adminDb.collection(...)`) used across ~40 call sites, while
 * the underlying instance is created only on first property/method access.
 * Methods are bound to the real instance; getters run with the correct `this`.
 */
function lazyProxy<T extends object>(resolve: () => T): T {
    return new Proxy({} as T, {
        get(_target, prop) {
            const instance = resolve() as Record<PropertyKey, unknown>;
            const value = instance[prop];
            return typeof value === "function"
                ? (value as (...args: unknown[]) => unknown).bind(instance)
                : value;
        },
    });
}

export const adminAuth: Auth = lazyProxy(() => (authInstance ??= getAuth(getAdminApp())));
export const adminDb: Firestore = lazyProxy(() => (dbInstance ??= getFirestore(getAdminApp())));
