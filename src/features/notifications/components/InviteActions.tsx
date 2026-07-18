"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Check, X } from "lucide-react";

import { declineInviteAction } from "@/features/flashcard/actions/access.actions";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/components/ui";
import { withFreshToken } from "./withFreshToken";
import { logNotificationDeleted, logNotificationRead } from "../actions/activity-log.actions";
import { resolveNotificationLink } from "../domain/format";
import { deleteNotification, markNotificationRead } from "../services";

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
            const ownerId = notification.data?.inviterId;
            const lessonId = notification.data?.lessonId;
            await deleteNotification(userId, notification.id);
            await withFreshToken((token) => {
                void logNotificationDeleted(
                    token,
                    userId,
                    notification.id,
                    notification.type,
                    notification.title,
                );
                // Actually revoke the pending invite so it can't
                // silently re-convert to access on the next share-link visit.
                if (ownerId && lessonId) void declineInviteAction(token, ownerId, lessonId);
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
