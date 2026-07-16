import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against the Firebase Auth+Firestore EMULATOR and a dedicated dev
 * server port (3100, distinct from the normal dev port 3000) — never against
 * production Firebase or a developer's already-running dev server. Setting
 * these here (not in .env/.env.local) means the emulator wiring in
 * src/lib/firebase.ts can never activate outside an actual Playwright run.
 */
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const AUTH_EMULATOR_HOST = "127.0.0.1:9099";
const FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

// Also apply to this config process itself, so e2e/helpers/emulator-auth.ts
// (running in the Playwright test-runner process, which inherits this env)
// talks to the same emulator instance as the app under test.
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= AUTH_EMULATOR_HOST;
process.env.FIRESTORE_EMULATOR_HOST ??= FIRESTORE_EMULATOR_HOST;
process.env.FIREBASE_ADMIN_PROJECT_ID ??= "demo-e2e";

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
    use: {
        baseURL: BASE_URL,
        trace: "on-first-retry",
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    webServer: [
        {
            command: "firebase emulators:start --only firestore,auth --project demo-e2e",
            url: `http://${AUTH_EMULATOR_HOST}`,
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
            stdout: "pipe",
        },
        {
            command: `next dev --port ${PORT}`,
            url: BASE_URL,
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
            stdout: "pipe",
            env: {
                NEXT_PUBLIC_USE_FIREBASE_EMULATOR: "true",
                FIREBASE_AUTH_EMULATOR_HOST: AUTH_EMULATOR_HOST,
                FIRESTORE_EMULATOR_HOST: FIRESTORE_EMULATOR_HOST,
                NEXT_PUBLIC_FIREBASE_API_KEY: "e2e-fake-key",
                NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "localhost",
                NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-e2e",
                NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "demo-e2e.appspot.com",
                NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "0",
                NEXT_PUBLIC_FIREBASE_APP_ID: "demo-e2e",
                FIREBASE_ADMIN_PROJECT_ID: "demo-e2e",
            },
        },
    ],
});
