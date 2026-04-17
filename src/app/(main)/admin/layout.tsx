import { AdminGuard } from "@/features/admin/components/AdminGuard";

/**
 * Admin Layout — Protects all pages under the /admin route group.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <AdminGuard>{children}</AdminGuard>;
}
