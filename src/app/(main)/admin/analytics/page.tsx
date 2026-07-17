import { AdminAnalyticsPageContent } from "@/features/admin/components";

export const metadata = {
    title: "Analytics | Admin",
    description: "Platform usage statistics, user engagement, and system performance.",
};

/**
 * Admin Analytics Page.
 *
 * @remarks Visualizes platform usage statistics, user engagement, and system performance.
 * @example
 * <AdminAnalyticsPage />
 */
export default function AdminAnalyticsPage() {
    return <AdminAnalyticsPageContent />;
}
