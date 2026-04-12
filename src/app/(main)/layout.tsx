import { BottomNav } from "@/shared/components/layout";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <BottomNav />
        </>
    );
}
