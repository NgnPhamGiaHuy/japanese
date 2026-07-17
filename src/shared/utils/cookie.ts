export const COOKIE_NAME = "auth-token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function setAuthCookie(token: string): void {
    // `Secure` only over HTTPS — omitted on http://localhost so local dev still sets the cookie.
    // Intentionally not httpOnly: the Firebase client SDK refreshes this token (see proxy.ts).
    const isSecure = typeof location !== "undefined" && location.protocol === "https:";
    document.cookie = [
        `${COOKIE_NAME}=${encodeURIComponent(token)}`,
        "path=/",
        `max-age=${MAX_AGE}`,
        "SameSite=Lax",
        ...(isSecure ? ["Secure"] : []),
    ].join("; ");
}

export function clearAuthCookie(): void {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

export function getAuthCookie(): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}
