/**
 * DashboardError — Error state for dashboard
 */

import { RefreshCw } from "lucide-react";

import { Button } from "@/shared/components/ui";

interface DashboardErrorProps {
    error: string;
}

const DashboardError = ({ error }: DashboardErrorProps) => {
    return (
        <div className="mb-6 flex items-center justify-between rounded-2xl border-2 border-[#ea2b2b]/30 bg-[#ffdfe0] px-5 py-4">
            <p className="text-sm font-bold text-[#ea2b2b]">{error}</p>
            <Button
                variant="ghost"
                onClick={() => window.location.reload()}
                className="!ml-4 !flex !items-center !gap-1 !text-xs !font-black !text-[#ea2b2b] shadow-none hover:underline hover:shadow-none active:translate-y-0"
                icon={RefreshCw}
                iconSize={14}
            >
                Retry
            </Button>
        </div>
    );
};

export default DashboardError;
