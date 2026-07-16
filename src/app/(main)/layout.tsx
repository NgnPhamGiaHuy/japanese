import { BottomNav } from "./_components/BottomNav";

// AdminProvider is intentionally NOT mounted here — it's already mounted once,
// app-wide, at the true root (see `lib/providers.tsx`). A second mount here
// used to cause a redundant admin-role check on every (main) page load; see
// AdminContext.tsx / useAdminRole() for the single source of truth.
export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <BottomNav />
        </>
    );
}
