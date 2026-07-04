/**
 * DashboardTabs — Tab switcher for personal/shared/discover decks
 */

import { Button } from "@/shared/components/ui";
import { DASHBOARD_TABS } from "../constants";

interface DashboardTabsProps {
    activeTab: "personal" | "shared" | "discover";
    onTabChange: (tab: "personal" | "shared" | "discover") => void;
    sharedCount: number;
    publicCount: number;
    personalCount: number;
}

const tabClass = (active: boolean) =>
    `!flex-1 !rounded-xl !py-2 !text-sm !font-black shadow-none !transition-all hover:shadow-none active:translate-y-0 ${
        active
            ? "!bg-white !text-text shadow-sm"
            : "!text-muted hover:!bg-transparent hover:!text-text"
    }`;

const DashboardTabs = ({
    activeTab,
    onTabChange,
    sharedCount,
    publicCount,
    personalCount,
}: DashboardTabsProps) => {
    const sortedTabs = [...DASHBOARD_TABS].sort((a, b) => a.priority - b.priority);

    const tabConfig: Record<string, { count: number; color: string }> = {
        personal: { count: personalCount, color: "bg-katakana" },
        shared: { count: sharedCount, color: "bg-both" },
        discover: { count: publicCount, color: "bg-hiragana" },
    };

    return (
        <div className="mb-6 flex gap-2 rounded-2xl bg-gray-100 p-1">
            {sortedTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const { count, color } = tabConfig[tab.id] || { count: 0, color: "bg-muted" };

                return (
                    <Button
                        key={tab.id}
                        variant="ghost"
                        onClick={() => onTabChange(tab.id as any)}
                        className={tabClass(isActive)}
                        badge={
                            count > 0 && (
                                <span
                                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${color} text-xs text-white`}
                                >
                                    {count}
                                </span>
                            )
                        }
                    >
                        {tab.label}
                    </Button>
                );
            })}
        </div>
    );
};

export default DashboardTabs;
