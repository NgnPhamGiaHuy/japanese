import { AdminContentPageContent } from "@/features/admin/components/content";

export const metadata = {
    title: "Content Management | Admin",
    description: "Manage global platform flashcards and learning content.",
};

/**
 * Admin Content Management Page.
 *
 * @remarks Orchestrates the global flashcard and lesson moderation tools.
 * @example
 * <AdminContentPage />
 */
export default function AdminContentPage() {
    return <AdminContentPageContent />;
}
