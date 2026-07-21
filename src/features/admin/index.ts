/**
 * Admin Feature — Public API
 *
 * @remarks
 * The only surface the app layer may import from. Admin is effectively a
 * parallel sub-application (its own RBAC, table engine, cache and action
 * client), so its public surface is deliberately narrow: page roots for the
 * route layer to mount, the role context, and the log vocabulary.
 *
 * Its services are Admin-SDK/`server-only` and are NOT exported here — they
 * are reachable only through this feature's own server actions.
 */

// Page roots — mounted by the /admin route segments.
export {
    AdminAnalyticsPageContent,
    AdminGuard,
    AdminOverviewPage,
    AdminReportsPageContent,
    AdminSettingsPageContent,
    AdminSidebar,
    AdminUsersPageContent,
} from "./components";
export { default as AdminContentPageContent } from "./components/content/AdminContentPageContent";

// Role context — mounted once in the provider composition root.
export { default as AdminProvider, useAdminRole } from "./context/AdminContext";

// Log vocabulary. Shared with lib/logging, which currently imports it across
// the layer boundary — the back-edge T-103a removes.
export type { AdminLog, LogLevel, LogSource, LogType } from "./types";
