/**
 * @file opengraph-image
 * Per-deck OG image for the public shared-deck route (next/og convention).
 */

import { ImageResponse } from "next/og";

import { getPublicSharedLessonPreview } from "@/features/flashcard/services/shared-preview.service";
import { DEFAULT_DECK_THEME_COLOR } from "@/features/flashcard/types";

export const alt = "Shared flashcard deck preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Fetches a Noto Sans JP subset covering the given text so deck titles/
 * descriptions with Japanese characters render correctly instead of tofu
 * boxes — Satori (next/og's renderer) has no built-in CJK glyph coverage.
 *
 * @remarks
 * Scoped to this server-only image route; never runs on a real user page
 * load, so it doesn't reintroduce the runtime Google Fonts dependency
 * next/font (lib/fonts.ts) was set up specifically to avoid for the app's
 * own UI. Spoofs an old Chrome UA because Google's CSS endpoint only serves
 * legacy TTF (not woff2, which Satori can't parse) to UAs that predate
 * woff2 support.
 */
async function loadNotoSansJP(text: string): Promise<ArrayBuffer | null> {
    try {
        const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
        const cssRes = await fetch(cssUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36",
            },
        });
        const css = await cssRes.text();
        const fontUrl = css.match(/src: url\(([^)]+)\)/)?.[1];
        if (!fontUrl) return null;

        const fontRes = await fetch(fontUrl);
        return await fontRes.arrayBuffer();
    } catch (err) {
        console.error("[opengraph-image] Noto Sans JP fetch failed:", err);
        return null;
    }
}

export default async function Image({ params }: { params: Promise<{ shareId: string }> }) {
    const { shareId } = await params;
    const preview = await getPublicSharedLessonPreview(shareId);

    const title = preview?.title || "Shared Flashcard Deck";
    const description = preview?.description ?? "";
    const cardCount = preview?.cardCount ?? 0;
    const accent = preview?.themeColor || DEFAULT_DECK_THEME_COLOR;

    const fontData = await loadNotoSansJP(`${title}${description}Kana&NihongoMastercards`);

    return new ImageResponse(
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: 64,
                background: "linear-gradient(135deg, #1cb0f6 0%, #ce82ff 100%)",
                fontFamily: fontData ? "Noto Sans JP" : "sans-serif",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 72,
                        height: 72,
                        borderRadius: 24,
                        background: "rgba(255, 255, 255, 0.25)",
                        fontSize: 40,
                        color: "#ffffff",
                        transform: "rotate(-6deg)",
                    }}
                >
                    あ
                </div>
                <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#ffffff" }}>
                    Kana &amp; Nihongo Master
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1000 }}>
                <div
                    style={{
                        display: "flex",
                        fontSize: 64,
                        fontWeight: 700,
                        color: "#ffffff",
                        lineHeight: 1.15,
                    }}
                >
                    {title}
                </div>
                {description && (
                    <div
                        style={{
                            display: "flex",
                            fontSize: 28,
                            fontWeight: 400,
                            color: "rgba(255, 255, 255, 0.85)",
                            lineHeight: 1.4,
                        }}
                    >
                        {description.length > 140 ? `${description.slice(0, 140)}…` : description}
                    </div>
                )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px 28px",
                        borderRadius: 999,
                        background: "#ffffff",
                        color: accent,
                        fontSize: 26,
                        fontWeight: 700,
                    }}
                >
                    {cardCount} cards
                </div>
            </div>
        </div>,
        {
            ...size,
            fonts: fontData ? [{ name: "Noto Sans JP", data: fontData, weight: 700 }] : undefined,
        },
    );
}
