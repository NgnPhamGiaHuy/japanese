"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
    completeGoogleRedirectSignIn,
    signInWithGoogle,
    signInWithGoogleRedirect,
} from "@/features/user/services";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/components/ui";

export default function LoginPage() {
    const t = useTranslations("LoginPage");
    const tCommon = useTranslations("Common");
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        completeGoogleRedirectSignIn()
            .then((user) => {
                if (active && user) router.replace("/");
            })
            .catch((err: unknown) => {
                const { code, message } = err as { code?: string; message?: string };
                if (process.env.NODE_ENV === "development") {
                    console.error("[Login] Google redirect sign-in failed:", { code, message });
                }
                if (active) setError(getSignInErrorMessage(code, t));
            });

        return () => {
            active = false;
        };
    }, [router, t]);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
            router.replace("/");
        } catch (err: unknown) {
            const { code, message } = err as { code?: string; message?: string };
            if (process.env.NODE_ENV === "development") {
                console.error("[Login] Google sign-in failed:", { code, message });
            }
            if (shouldUseRedirectSignIn(code)) {
                try {
                    await signInWithGoogleRedirect();
                    return;
                } catch (redirectErr: unknown) {
                    const redirectCode = (redirectErr as { code?: string }).code;
                    setError(getSignInErrorMessage(redirectCode, t));
                    setLoading(false);
                    return;
                }
            }
            if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
                setError(getSignInErrorMessage(code, t));
            }
            setLoading(false);
        }
    };

    return (
        <div className="bg-bg fixed inset-0 flex flex-col items-center justify-center px-6">
            {/* Logo mark */}
            <div className="animate-in fade-in slide-in-from-bottom-4 mb-10 flex flex-col items-center gap-4 duration-500">
                <div className="rounded-5xl border-katakana-strong from-katakana to-both flex h-24 w-24 -rotate-6 items-center justify-center border-b-8 bg-gradient-to-br text-5xl font-medium text-white shadow-sm">
                    あ
                </div>
                <div className="text-center">
                    <h1 className="text-text text-3xl font-black">{tCommon("brandName")}</h1>
                    <p className="text-muted mt-1 text-base font-bold">{t("subtitle")}</p>
                </div>
            </div>

            {/* Sign-in card */}
            <div className="animate-in fade-in slide-in-from-bottom-6 w-full max-w-sm delay-100 duration-500">
                <Button
                    onClick={handleGoogleSignIn}
                    loading={loading}
                    variant="secondary"
                    className="!text-text w-full !py-4 !shadow-sm transition-all duration-200"
                >
                    {!loading && <GoogleIcon />}
                    {loading ? t("signingIn") : t("continueWithGoogle")}
                </Button>

                {error && <p className="text-danger mt-4 text-center text-sm font-bold">{error}</p>}

                <p className="text-muted mt-6 text-center text-xs font-bold">
                    {t("progressSaved")}
                </p>
            </div>
        </div>
    );
}

function shouldUseRedirectSignIn(code?: string) {
    return (
        code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment"
    );
}

function getSignInErrorMessage(
    code: string | undefined,
    t: ReturnType<typeof useTranslations<"LoginPage">>,
) {
    switch (code) {
        case "auth/popup-blocked":
        case "auth/operation-not-supported-in-this-environment":
            return t("errors.popupBlocked");
        case "auth/unauthorized-domain":
            return t("errors.unauthorizedDomain");
        case "auth/operation-not-allowed":
            return t("errors.operationNotAllowed");
        default:
            return t("errors.generic");
    }
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
