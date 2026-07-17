/**
 * DashboardError — Error state for dashboard
 */

import { useTranslations } from "next-intl";

import { RefreshCw } from "lucide-react";

import { Button } from "@/shared/components/ui";

interface DashboardErrorProps {
    error: string;
}

const DashboardError = ({ error }: DashboardErrorProps) => {
    const t = useTranslations("FlashcardDashboard");

    return (
        <div className="border-danger/30 bg-danger-bg mb-6 flex items-center justify-between rounded-2xl border-2 px-5 py-4">
            <p className="text-danger text-sm font-bold">{error}</p>
            <Button
                variant="ghost"
                onClick={() => window.location.reload()}
                className="!text-danger !ml-4 !flex !items-center !gap-1 !text-xs !font-black shadow-none hover:underline hover:shadow-none active:translate-y-0"
                icon={RefreshCw}
                iconSize={14}
            >
                {t("retry")}
            </Button>
        </div>
    );
};

export default DashboardError;
