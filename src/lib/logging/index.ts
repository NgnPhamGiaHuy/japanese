/**
 * Shared logging engine.
 *
 * - Use `enqueueClientLog` (browser.ts) for client-side audit logs.
 * - Use `persistSystemLog` (server.ts) for server-side actions.
 * - `appendClientLogAction` (actions.ts) is the Next.js Server Action bridge.
 * - Use `ActivityAction` constants for all `action` field values.
 */

export * from "./public";
export * from "./browser";
export * from "./actions.enum";
export { systemLogInputSchema } from "./schema";
