import { Bell, Copy, MessageSquare, Shield, Trash2, UserPlus } from "lucide-react";

import type { NotificationType } from "../types";

const ICON_BASE = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full";

/**
 * Compile-time exhaustiveness check (ADR-108/T-108a): if `NotificationType`
 * ever grows a value this switch doesn't handle, `type` narrows to something
 * other than `never` here and TypeScript rejects the call — the widening's
 * whole point was to stop a missing case from silently falling through to
 * the generic icon below.
 */
function assertNever(type: never): never {
    throw new Error(`NotificationIcon: unhandled notification type "${String(type)}"`);
}

const NotificationIcon = ({ type }: { type: NotificationType }) => {
    switch (type) {
        case "invite":
        case "invite_accepted":
            return (
                <div className={`${ICON_BASE} bg-blue-100 text-blue-600`}>
                    <UserPlus size={18} />
                </div>
            );
        case "comment":
        case "comment_resolved":
            return (
                <div className={`${ICON_BASE} bg-purple-100 text-purple-600`}>
                    <MessageSquare size={18} />
                </div>
            );
        case "reply":
            return (
                <div className={`${ICON_BASE} bg-green-100 text-green-600`}>
                    <MessageSquare size={18} />
                </div>
            );
        case "role_change":
        case "access_revoked":
            return (
                <div className={`${ICON_BASE} bg-amber-100 text-amber-600`}>
                    <Shield size={18} />
                </div>
            );
        case "deck_duplicated":
            return (
                <div className={`${ICON_BASE} bg-teal-100 text-teal-600`}>
                    <Copy size={18} />
                </div>
            );
        case "content_removed":
            return (
                <div className={`${ICON_BASE} bg-red-100 text-red-600`}>
                    <Trash2 size={18} />
                </div>
            );
        case "digest":
            return (
                <div className={`${ICON_BASE} bg-gray-100 text-gray-500`}>
                    <Bell size={18} />
                </div>
            );
        default:
            return assertNever(type);
    }
};

export default NotificationIcon;
