/**
 * Shared logging engine.
 *
 * - Use `enqueueClientLog` (browser.ts) for client-side audit logs.
 * - Use `persistSystemLog` (server.ts) for server-side actions.
 * - `appendClientLogAction` (actions.ts) is the Next.js Server Action bridge.
 */

export * from "./public";
export * from "./browser";
export { systemLogInputSchema } from "./schema";
