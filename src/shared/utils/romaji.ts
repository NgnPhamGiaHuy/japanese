/** Maps canonical romanisation to acceptable alternates */
const ROMAJI_ALTERNATIVES: Record<string, string[]> = {
    shi: ["si"],
    chi: ["ti"],
    tsu: ["tu"],
    fu: ["hu"],
    ji: ["zi", "dji"],
    zu: ["dzu"],
    ja: ["zya"],
    ju: ["zyu"],
    jo: ["zyo"],
    sha: ["sya"],
    shu: ["syu"],
    sho: ["syo"],
    cha: ["tya", "cya"],
    chu: ["tyu", "cyu"],
    cho: ["tyo", "cyo"],
    o: ["wo"],
};

/** Returns all accepted romaji spellings for a given romaji string (may contain spaces) */
export function getValidRomaji(romajiStr: string): string[] {
    const clean = romajiStr.toLowerCase().replace(/[()]/g, "").trim();
    const base = clean.split(" ").filter((r) => r.length > 0);
    const expanded = [...base];

    base.forEach((ans) => {
        if (ROMAJI_ALTERNATIVES[ans]) expanded.push(...ROMAJI_ALTERNATIVES[ans]);
    });

    return [...new Set(expanded)];
}

/** Returns true if the user's typed input matches any accepted romaji for the card */
export function checkTypedAnswer(input: string, romajiStr: string): boolean {
    return getValidRomaji(romajiStr).includes(input.trim().toLowerCase());
}
