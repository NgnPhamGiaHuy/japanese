"use client";

import { useFirebaseAuth } from "@/features/user/hooks/useFirebaseAuth";

/** Client-side shell that initialises Firebase auth and wraps the app */
export function Providers({ children }: { children: React.ReactNode }) {
    useFirebaseAuth();
    return <>{children}</>;
}
