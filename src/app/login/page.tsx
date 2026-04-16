"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { signInWithGoogle } from "@/features/user/services";
import { Button } from "@/shared/components/ui";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
            router.replace("/");
        } catch (err: unknown) {
            const code = (err as { code?: string }).code;
            if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
                setError("Sign-in failed. Please try again.");
            }
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#F7F7F8] px-6">
            {/* Logo mark */}
            <div className="animate-in fade-in slide-in-from-bottom-4 mb-10 flex flex-col items-center gap-4 duration-500">
                <div className="flex h-24 w-24 -rotate-6 items-center justify-center rounded-[2.5rem] border-b-8 border-[#1899d6] bg-gradient-to-br from-[#1cb0f6] to-[#ce82ff] text-5xl font-medium text-white shadow-sm">
                    あ
                </div>
                <div className="text-center">
                    <h1 className="text-3xl font-black text-[#3c3c3c]">Kana Master</h1>
                    <p className="mt-1 text-base font-bold text-[#afafaf]">
                        Learn Japanese with confidence
                    </p>
                </div>
            </div>

            {/* Sign-in card */}
            <div className="animate-in fade-in slide-in-from-bottom-6 w-full max-w-sm delay-100 duration-500">
                <Button
                    onClick={handleGoogleSignIn}
                    loading={loading}
                    variant="secondary"
                    className="w-full !py-4 !text-[#3c3c3c] !shadow-sm transition-all duration-200"
                >
                    {!loading && <GoogleIcon />}
                    {loading ? "Signing in…" : "Continue with Google"}
                </Button>

                {error && (
                    <p className="mt-4 text-center text-sm font-bold text-[#ea2b2b]">{error}</p>
                )}

                <p className="mt-6 text-center text-xs font-bold text-[#afafaf]">
                    Your progress is saved to your Google account
                </p>
            </div>
        </div>
    );
}

function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    );
}
