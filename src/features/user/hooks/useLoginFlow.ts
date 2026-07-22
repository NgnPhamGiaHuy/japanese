"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useRouter } from "@/i18n/navigation";
import {
    completeGoogleRedirectSignIn,
    signInWithGoogle,
    signInWithGoogleRedirect,
} from "../services";

/**
 * Google sign-in orchestration for the login screen: redirect-completion on
 * mount, the popup→redirect fallback policy, and auth error-code→message
 * mapping.
 */
export function useLoginFlow() {
    const t = useTranslations("LoginPage");
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

    return { loading, error, handleGoogleSignIn };
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
