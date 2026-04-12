// Design tokens — kept as constants to avoid magic numbers in JSX
export const SPACING = {
    pagePadding: "px-6",
    sectionGap: "space-y-6",
    cardGap: "gap-4",
    cardPadding: "p-5",
} as const;

export const CARD_BASE =
    "bg-white rounded-[1.5rem] border-2 border-b-4 border-gray-200 shadow-sm";

export const CARD_INTERACTIVE = `${CARD_BASE} hover:-translate-y-1 hover:shadow-md transition-all duration-200 active:translate-y-[2px] active:border-b-2`;

export const SECTION_HEADING = "text-xl font-black text-[#3c3c3c]";
