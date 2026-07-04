import { AdminGuard, AdminSidebar } from "@/features/admin/components";

/**
 * Layout component for the Admin dashboard section.
 *
 * @remarks Wraps admin routes with authentication guards and sidebar navigation.
 * Global admin role context (`AdminProvider`) is mounted once, app-wide, in the
 * parent `(main)/layout.tsx` — this section only needs the route-level guard.
 * @example
 * <AdminLayout>
 *   <AdminPage />
 * </AdminLayout>
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminGuard>
            <div className="bg-bg flex min-h-screen">
                <AdminSidebar />
                {/* pt-14 on mobile to clear the fixed top bar; no offset needed on lg */}
                <main className="flex-1 pt-14 lg:pt-0 lg:pl-64">
                    <div className="mx-auto min-h-screen max-w-7xl pb-32">{children}</div>
                </main>
            </div>
        </AdminGuard>
    );
}
