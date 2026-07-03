import { BottomNav } from "./_components/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <BottomNav />
        </>
    );
}
