// TODO(E3-T5/ADR-10): no hosting platform decision has been recorded yet
// (no docs/adr/0xx-hosting.md, no firebase.json/vercel.json) — this falls
// back to localhost so metadata/OG/sitemap URLs resolve correctly in dev
// until a real production domain is set via NEXT_PUBLIC_SITE_URL.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
