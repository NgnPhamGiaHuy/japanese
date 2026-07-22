"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Check, X } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/components/ui";
import { logNotificationDeleted, logNotificationRead } from "../actions/activity-log.actions";
import { resolveNotificationActions } from "../domain/action-registry";
import { resolveNotificationLink } from "../domain/format";
import { deleteNotification, markNotificationRead, withFreshToken } from "../services";

import type { AppNotification } from "../types";

/** Accept / Decline buttons for invite notifications. */
const InviteActions = ({
    notification,
    userId,
}: {
    notification: AppNotification;
    userId: string;
}) => {
    const t = useTranslations("NotificationsPage");
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const link = resolveNotificationLink(notification);

    const handleAccept = () => {
        startTransition(async () => {
            await markNotificationRead(userId, notification.id);
            void withFreshToken((token) =>
                logNotificationRead(
                    token,
                    userId,
                    notification.id,
                    notification.type,
                    notification.title,
                ),
            );
            router.push(link);
        });
    };

    const handleDecline = () => {
        startTransition(async () => {
            await deleteNotification(userId, notification.id);
            await withFreshToken((token) => {
                void logNotificationDeleted(
                    token,
                    userId,
                    notification.id,
                    notification.type,
                    notification.title,
                );
                // Revoking the pending invite is the producing feature's work,
                // not the inbox's — this component must not know which feature
                // issued the invite. The handler is registered through the seam
                // at the composition root (ADR-102); if none is registered the
                // decline still removes the notification and the gap is
                // reported rather than silently skipped.
                // Reported to the console rather than the client audit log: a
                // missing registration is a wiring defect, its audience is a
                // developer, and it must surface immediately. Routing it
                // through `lib/logging/browser` would also pull that module's
                // `server-only` transitive import into this client component
                // and break its browser test.
                //
                // Narrowed explicitly (not just for the type-checker): this
                // component only ever renders for `type === "invite"`
                // (NotificationRow's own gate), but `notification.type` is the
                // full `NotificationType` — which, since T-108a, includes
                // `"digest"`, not a valid `NotificationKind` the act-side
                // registry can key on. Guarding here documents that invariant
                // rather than asserting past it.
                if (notification.type === "invite") {
                    const handlers = resolveNotificationActions(notification.type, (message) => {
                        console.error(`[notifications] ${message}`);
                    });
                    void handlers?.onDecline?.({ idToken: token, notification, userId });
                }
            });
        });
    };

    return (
        <div className="mt-3 flex gap-2">
            <Button
                onClick={handleAccept}
                loading={isPending}
                variant="primary"
                size="auto"
                className="flex-1 rounded-xl px-3 py-2 text-xs font-black"
                icon={Check}
                iconSize={13}
            >
                {t("accept")}
            </Button>
            <Button
                onClick={handleDecline}
                loading={isPending}
                variant="secondary"
                size="auto"
                className="flex-1 rounded-xl border-gray-300 px-3 py-2 text-xs font-black"
                icon={X}
                iconSize={13}
            >
                {t("decline")}
            </Button>
        </div>
    );
};

export default InviteActions;
