import { AdminReportsPageContent } from "@/features/admin/components";

export const metadata = {
    title: "Reports | Admin",
    description: "System logs, user reports, and audit trails.",
};

/**
 * Admin Reports Page.
 *
 * @remarks Aggregates and displays system logs, user reports, and audit trails.
 * @example
 * <AdminReportsPage />
 */
export default function AdminReportsPage() {
    return <AdminReportsPageContent />;
}
