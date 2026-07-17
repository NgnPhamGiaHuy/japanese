import { AdminSettingsPageContent } from "@/features/admin/components";

export const metadata = {
    title: "Settings | Admin",
    description: "Global administrative configuration.",
};

/**
 * Admin Settings Page.
 *
 * @remarks Provides interface for managing global administrative configurations.
 * @example
 * <AdminSettingsPage />
 */
export default function AdminSettingsPage() {
    return <AdminSettingsPageContent />;
}
