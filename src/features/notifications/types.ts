export type NotificationType = "invite" | "comment" | "reply" | "role_change";

export interface AppNotification {
    id: string;
    /** The user who should receive this notification */
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    /** UID of the user who triggered the event */
    senderId: string;
    /** Display name of the sender (snapshot at creation time) */
    senderName?: string | null;
    /** The lesson/deck this notification relates to */
    deckId: string;
    deckTitle?: string | null;
    /** Deep link to navigate to when clicked */
    link: string;
    read: boolean;
    createdAt: number;
}
