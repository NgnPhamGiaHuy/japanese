import AdminProvider from "@/features/admin/context/AdminContext";
import { BottomNav } from "./_components/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminProvider>
            {children}
            <BottomNav />
        </AdminProvider>
    );
}
