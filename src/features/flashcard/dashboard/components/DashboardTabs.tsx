/**
 * DashboardTabs — Tab switcher for personal/shared decks
 */

import { Button } from "@/shared/components/ui";

import type { DashboardTab } from "../types";

interface DashboardTabsProps {
    activeTab: "personal" | "shared";
    onTabChange: (tab: "personal" | "shared") => void;
    sharedCount: number;
}

const DashboardTabs = ({ activeTab, onTabChange, sharedCount }: DashboardTabsProps) => {
    return (
        <div className="mb-6 flex gap-2 rounded-2xl bg-gray-100 p-1">
            <Button
                variant="ghost"
                onClick={() => onTabChange("personal")}
                className={`!flex-1 !rounded-xl !py-2 !text-sm !font-black shadow-none !transition-all hover:shadow-none active:translate-y-0 ${
                    activeTab === "personal"
                        ? "!bg-white !text-[#3c3c3c] shadow-sm"
                        : "!text-[#afafaf] hover:!bg-transparent hover:!text-[#3c3c3c]"
                }`}
            >
                My Decks
            </Button>
            <Button
                variant="ghost"
                onClick={() => onTabChange("shared")}
                className={`!flex-1 !rounded-xl !py-2 !text-sm !font-black shadow-none !transition-all hover:shadow-none active:translate-y-0 ${
                    activeTab === "shared"
                        ? "!bg-white !text-[#3c3c3c] shadow-sm"
                        : "!text-[#afafaf] hover:!bg-transparent hover:!text-[#3c3c3c]"
                }`}
                badge={
                    sharedCount > 0 && (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ce82ff] text-[10px] text-white">
                            {sharedCount}
                        </span>
                    )
                }
            >
                Shared with me
            </Button>
        </div>
    );
};

export default DashboardTabs;
