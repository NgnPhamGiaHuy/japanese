/**
 * @file index.ts
 * Deploy entry point — every exported binding here becomes one deployed
 * Cloud Function (`firebase deploy --only functions`, scoped from src/ via
 * firebase.json's functions.source).
 */
export { dailyNotificationDigest } from "./digest";
export { deliverNotificationTask, fanOutNotifications } from "./fanout";
