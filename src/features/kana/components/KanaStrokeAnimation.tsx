"use client";

import { useState, useEffect } from "react";

interface SvgData {
    paths: string[];
    texts: { text: string; transform: string | null }[];
}

interface SvgEntry {
    char: string;
    data: SvgData | null;
}

const svgCache: Record<string, SvgData | null> = {};

async function fetchKanaSvg(char: string): Promise<SvgData | null> {
    if (char in svgCache) return svgCache[char];
    const hex = char.charCodeAt(0).toString(16).padStart(5, "0");
    try {
        const res = await fetch(
            `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${hex}.svg`
        );
        if (!res.ok) {
            svgCache[char] = null;
            return null;
        }
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "image/svg+xml");
        const paths = Array.from(doc.querySelectorAll("path")).map(
            (p) => p.getAttribute("d") ?? ""
        );
        const texts = Array.from(doc.querySelectorAll("text")).map((t) => ({
            text: t.textContent ?? "",
            transform: t.getAttribute("transform"),
        }));
        svgCache[char] = { paths, texts };
        return svgCache[char];
    } catch {
        svgCache[char] = null;
        return null;
    }
}

interface KanaStrokeAnimationProps {
    charStr: string;
    activeFont?: string;
    svgClassName?: string;
    strokeColor?: string;
}

export default function KanaStrokeAnimation({
    charStr,
    activeFont,
    svgClassName = "w-12 h-12 md:w-24 md:h-24",
    strokeColor = "#1cb0f6",
}: KanaStrokeAnimationProps) {
    const [svgData, setSvgData] = useState<SvgEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const chars = charStr.split("");
            const data: SvgEntry[] = [];
            for (const c of chars) {
                const d = await fetchKanaSvg(c);
                data.push({ char: c, data: d });
            }
            if (mounted) {
                setSvgData(data);
                setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [charStr]);

    if (loading)
        return (
            <div
                className={`animate-pulse bg-gray-200 rounded-xl ${svgClassName}`}
            />
        );

    return (
        <div className="flex items-center justify-center w-full h-full gap-1">
            {svgData.map((item, idx) =>
                item.data ? (
                    <svg
                        key={idx}
                        viewBox="0 0 109 109"
                        className={`${svgClassName} drop-shadow-sm`}
                    >
                        <g
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            {item.data.paths.map((d, i) => (
                                <path key={`bg-${i}`} d={d} />
                            ))}
                        </g>
                        <g
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            {item.data.paths.map((d, i) => (
                                <path key={`fg-${i}`} d={d} />
                            ))}
                        </g>
                        <g fill="#ff9600" fontSize="8" fontWeight="bold">
                            {item.data.texts.map((t, i) => (
                                <text
                                    key={`txt-${i}`}
                                    transform={t.transform ?? undefined}
                                >
                                    {t.text}
                                </text>
                            ))}
                        </g>
                    </svg>
                ) : (
                    <span
                        key={idx}
                        className="text-3xl md:text-5xl font-medium text-gray-300"
                        style={{ fontFamily: activeFont }}
                    >
                        {item.char}
                    </span>
                )
            )}
        </div>
    );
}
