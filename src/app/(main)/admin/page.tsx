/**
 * Admin Dashboard Page — Pure orchestrator.
 *
 * @remarks
 * Responsibilities (ONLY):
 * - Render AdminDashboard feature root
 *
 * NO business logic, NO state management, NO direct service calls.
 */

import { AdminDashboard } from "@/features/admin";

export default function AdminPage() {
    return <AdminDashboard />;
}
