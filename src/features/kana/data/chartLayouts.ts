import type { KanaChar } from "../types/kana.types";

const VOWEL_HEADERS = ["a", "i", "u", "e", "o"] as const;
const YOON_HEADERS = ["ya", "yu", "yo"] as const;

/** Map romaji to gojūon column index (あ段 … お段). */
export function gojuonColumn(romaji: string): number {
    const r = romaji
        .toLowerCase()
        .replace(/\s*\([^)]*\)/g, "")
        .trim()
        .split(/\s+/)[0];
    const col: Record<string, number> = { a: 0, i: 1, u: 2, e: 3, o: 4 };
    if (r === "n") return 2;
    for (let i = r.length - 1; i >= 0; i--) {
        const ch = r[i];
        if (ch in col) return col[ch];
    }
    return 0;
}

function charMap(dataset: KanaChar[]): Map<string, KanaChar> {
    return new Map(dataset.map((c) => [c.char, c]));
}

function rowFromGroup(
    dataset: KanaChar[],
    group: string
): (KanaChar | null)[] {
    const cells: (KanaChar | null)[] = [null, null, null, null, null];
    for (const c of dataset) {
        if (c.group !== group) continue;
        const col = gojuonColumn(c.romaji);
        if (col >= 0 && col < 5) cells[col] = c;
    }
    return cells;
}

export type ChartBlock = {
    title: string;
    headers: readonly string[];
    /** Each inner array is one row (cells match headers left-to-right) */
    rows: { label: string; cells: (KanaChar | null)[] }[];
};

/** Display order when showing hiragana + katakana together (both scripts). */
export const CHART_SECTION_TITLES = [
    "Basic Gojūon",
    "Dakuten (voiced)",
    "Handakuten (semi-voiced)",
    "Yōon (unvoiced)",
    "Yōon (voiced / p)",
    "Extended (foreign sounds)",
    "Extended yōon",
] as const;

const BASIC_ROW_META: { label: string; group: string }[] = [
    { label: "∅", group: "vowels" },
    { label: "K", group: "k-row" },
    { label: "S", group: "s-row" },
    { label: "T", group: "t-row" },
    { label: "N", group: "n-row" },
    { label: "H", group: "h-row" },
    { label: "M", group: "m-row" },
    { label: "Y", group: "y-row" },
    { label: "R", group: "r-row" },
    { label: "W", group: "w-row" },
    { label: "N", group: "n-misc" },
];

const DAKUTEN_ROW_META: { label: string; group: string }[] = [
    { label: "G", group: "dakuten" },
    { label: "Z", group: "dakuten" },
    { label: "D", group: "dakuten" },
    { label: "B", group: "dakuten" },
];

/** Dakuten block: first 5 are g, next 5 z, next 5 d, last 5 b — data order matches. */
function dakutenRows(dataset: KanaChar[]): { label: string; cells: (KanaChar | null)[] }[] {
    const dak = dataset.filter((c) => c.group === "dakuten");
    const rows: { label: string; cells: (KanaChar | null)[] }[] = [];
    for (let i = 0; i < DAKUTEN_ROW_META.length; i++) {
        const slice = dak.slice(i * 5, i * 5 + 5);
        const cells: (KanaChar | null)[] = [null, null, null, null, null];
        for (const c of slice) {
            const col = gojuonColumn(c.romaji);
            if (col >= 0 && col < 5) cells[col] = c;
        }
        rows.push({ label: DAKUTEN_ROW_META[i].label, cells });
    }
    return rows;
}

function handakutenRow(dataset: KanaChar[]): { label: string; cells: (KanaChar | null)[] }[] {
    return [
        {
            label: "P",
            cells: rowFromGroup(dataset, "handakuten"),
        },
    ];
}

/** Yōon: dataset order is triplets (…ゃ, …ゅ, …ょ) per consonant group. */
function yoonRows(chars: KanaChar[], labels: string[]): ChartBlock["rows"] {
    const rows: ChartBlock["rows"] = [];
    for (let i = 0; i < chars.length; i += 3) {
        const triplet = chars.slice(i, i + 3);
        if (triplet.length === 0) break;
        rows.push({
            label: labels[rows.length] ?? `·`,
            cells: [
                triplet[0] ?? null,
                triplet[1] ?? null,
                triplet[2] ?? null,
            ],
        });
    }
    return rows;
}

const YOON_LABELS_UNVOICED = [
    "Ky",
    "Sh",
    "Ch",
    "Ny",
    "Hy",
    "My",
    "Ry",
];

const YOON_LABELS_VOICED = ["Gy", "J", "By", "Py"];

/** Katakana-only extended tables (romaji a i u e o columns). */
function extendedKatakanaRows(
    byChar: Map<string, KanaChar>
): { label: string; cells: (KanaChar | null)[] }[] {
    const g = (chars: (string | null)[]) =>
        chars.map((ch) => (ch ? byChar.get(ch) ?? null : null));

    const rows: { label: string; cells: (KanaChar | null)[] }[] = [
        {
            label: "V",
            cells: g(["ヴァ", "ヴィ", "ヴ", "ヴェ", "ヴォ"]),
        },
        {
            label: "F",
            cells: g(["ファ", "フィ", null, "フェ", "フォ"]),
        },
        {
            label: "W",
            cells: g([null, "ウィ", null, "ウェ", "ウォ"]),
        },
        {
            label: "T",
            cells: g([null, "ティ", "トゥ", null, null]),
        },
        {
            label: "D",
            cells: g([null, "ディ", "ドゥ", null, null]),
        },
        {
            label: "Ts",
            cells: g(["ツァ", "ツィ", null, "ツェ", "ツォ"]),
        },
        {
            label: "Sh",
            cells: g([null, null, null, "シェ", null]),
        },
        {
            label: "J",
            cells: g([null, null, null, "ジェ", null]),
        },
        {
            label: "Ch",
            cells: g([null, null, null, "チェ", null]),
        },
    ];

    return rows.filter((row) => row.cells.some((c) => c !== null));
}

function extendedYoonKatakanaRows(
    byChar: Map<string, KanaChar>
): { label: string; cells: (KanaChar | null)[] }[] {
    const g = (chars: (string | null)[]) =>
        chars.map((ch) => (ch ? byChar.get(ch) ?? null : null));

    const rows = [
        { label: "V", cells: g([null, "ヴュ", null]) },
        { label: "F", cells: g([null, "フュ", null]) },
        { label: "T", cells: g([null, "テュ", null]) },
        { label: "D", cells: g([null, "デュ", null]) },
    ];
    return rows.filter((row) => row.cells.some((c) => c !== null));
}

export function buildChartBlocks(dataset: KanaChar[], isKatakana: boolean): ChartBlock[] {
    const blocks: ChartBlock[] = [];

    blocks.push({
        title: "Basic Gojūon",
        headers: VOWEL_HEADERS,
        rows: BASIC_ROW_META.map(({ label, group }) => ({
            label,
            cells: rowFromGroup(dataset, group),
        })),
    });

    const dak = dataset.filter((c) => c.group === "dakuten");
    if (dak.length > 0) {
        blocks.push({
            title: "Dakuten (voiced)",
            headers: VOWEL_HEADERS,
            rows: dakutenRows(dataset),
        });
    }

    const handRows = handakutenRow(dataset);
    if (handRows[0].cells.some((c) => c !== null)) {
        blocks.push({
            title: "Handakuten (semi-voiced)",
            headers: VOWEL_HEADERS,
            rows: handRows,
        });
    }

    const yoon = dataset.filter((c) => c.group === "yōon");
    if (yoon.length > 0) {
        blocks.push({
            title: "Yōon (unvoiced)",
            headers: YOON_HEADERS,
            rows: yoonRows(yoon, YOON_LABELS_UNVOICED),
        });
    }

    const yoonV = dataset.filter((c) => c.group === "yōon-voiced");
    if (yoonV.length > 0) {
        blocks.push({
            title: "Yōon (voiced / p)",
            headers: YOON_HEADERS,
            rows: yoonRows(yoonV, YOON_LABELS_VOICED),
        });
    }

    if (isKatakana) {
        const byChar = charMap(dataset);
        const extRows = extendedKatakanaRows(byChar);
        if (extRows.length > 0) {
            blocks.push({
                title: "Extended (foreign sounds)",
                headers: VOWEL_HEADERS,
                rows: extRows,
            });
        }
        const extYRows = extendedYoonKatakanaRows(byChar);
        if (extYRows.length > 0) {
            blocks.push({
                title: "Extended yōon",
                headers: YOON_HEADERS,
                rows: extYRows,
            });
        }
    }

    return blocks;
}
