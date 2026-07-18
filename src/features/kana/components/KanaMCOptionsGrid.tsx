import { Button } from "@/shared/components/ui";

import type { KanaChar } from "@/features/kana/types";

interface KanaMCOptionsGridProps {
    options: KanaChar[];
    correctRomaji: string;
    status: "idle" | "correct" | "wrong";
    onSelect: (option: KanaChar) => void;
}

/** Multiple-choice romaji grid shared by Quiz and Survival's playing screens. */
const KanaMCOptionsGrid = ({
    options,
    correctRomaji,
    status,
    onSelect,
}: KanaMCOptionsGridProps) => {
    return (
        <div className="grid w-full grid-cols-2 gap-3">
            {options.map((opt, i) => {
                let state =
                    "bg-white text-text border-gray-200 hover:bg-gray-50 hover:-translate-y-1 hover:shadow-md hover:border-gray-300";
                if (status !== "idle") {
                    if (opt.romaji === correctRomaji)
                        state =
                            "bg-hiragana text-white border-hiragana-strong translate-y-[2px] border-b-2";
                    else state = "bg-white border-gray-200 text-gray-300 opacity-50";
                }
                return (
                    <Button
                        key={i}
                        variant="ghost"
                        disabled={status !== "idle"}
                        onClick={() => onSelect(opt)}
                        className={`!h-[72px] !rounded-2xl !border-2 !border-b-4 !text-xl !font-black shadow-none transition-all duration-150 select-none hover:shadow-none active:translate-y-0 ${state}`}
                    >
                        {opt.romaji}
                    </Button>
                );
            })}
        </div>
    );
};

export default KanaMCOptionsGrid;
