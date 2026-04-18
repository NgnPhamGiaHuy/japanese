import { AdminGuard, AdminSidebar } from "@/features/admin/components";
import AdminProvider from "@/features/admin/context/AdminContext";

/**
 * Layout component for the Admin dashboard section.
 *
 * @remarks Wraps admin routes with authentication guards, sidebar navigation, and global admin context.
 * @example
 * <AdminLayout>
 *   <AdminPage />
 * </AdminLayout>
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminGuard>
            <div className="flex min-h-screen bg-[#F7F7F8]">
                <AdminSidebar />
                <main className="flex-1 lg:pl-64">
                    <div className="mx-auto min-h-screen max-w-7xl pb-32">{children}</div>
                </main>
            </div>
        </AdminGuard>
    );
}
