import { BellOff, Check } from "lucide-react";

export function SkeletonRows() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="animate-pulse overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-4"
                >
                    <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200" />
                        <div className="flex-1 space-y-2 pt-1">
                            <div className="h-3.5 w-32 rounded bg-gray-200" />
                            <div className="h-3 w-48 rounded bg-gray-100" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function NotificationsEmptyState({ filter }: { filter: "all" | "unread" }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-4xl bg-gray-100">
                {filter === "unread" ? (
                    <Check size={36} className="text-gray-300" />
                ) : (
                    <BellOff size={36} className="text-gray-300" />
                )}
            </div>
            <h2 className="text-text mb-1 text-xl font-black">
                {filter === "unread" ? "You're all caught up! 🎉" : "No notifications yet"}
            </h2>
            <p className="text-muted max-w-xs font-bold">
                {filter === "unread"
                    ? "No unread notifications right now."
                    : "Invites, comments, and replies will appear here."}
            </p>
        </div>
    );
}
