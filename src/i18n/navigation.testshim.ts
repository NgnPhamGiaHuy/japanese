/**
 * Test-only stand-in for @/i18n/navigation, aliased in vitest.browser.config.ts.
 *
 * next-intl's client Link/useRouter/usePathname wrap next/link and
 * next/navigation in a way that trips Vite's dep optimizer under Vitest
 * Browser Mode (two inconsistently pre-bundled copies of next/navigation,
 * "does not provide an export" at runtime). The affected component tests
 * only exercise rendering/interaction, never locale-prefixed routing, so
 * the plain Next.js primitives are behaviorally equivalent here.
 */
export { default as Link } from "next/link";
export { redirect, usePathname, useRouter } from "next/navigation";

export function getPathname({ href }: { href: string | { pathname: string } }): string {
    return typeof href === "string" ? href : href.pathname;
}
