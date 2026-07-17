import { useTranslations } from "next-intl";

import { BookOpen, Plus, Sparkles } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/components/ui";

interface DashboardEmptyProps {
    activeTab: "personal" | "shared" | "discover";
}

const DashboardEmpty = ({ activeTab }: DashboardEmptyProps) => {
    const t = useTranslations("FlashcardDashboard.empty");
    const router = useRouter();

    if (activeTab === "discover") {
        return (
            <div className="py-20 text-center">
                <div className="border-hiragana-hover bg-hiragana mx-auto mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-4xl border-b-8 text-white shadow-sm">
                    <Sparkles size={48} strokeWidth={3} />
                </div>
                <h2 className="text-text mb-2 text-2xl font-black">{t("discoverTitle")}</h2>
                <p className="text-muted font-bold">{t("discoverDescription")}</p>
            </div>
        );
    }

    return (
        <div className="py-20 text-center">
            <div className="border-both-strong bg-both mx-auto mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-4xl border-b-8 text-white shadow-sm">
                <BookOpen size={48} strokeWidth={3} />
            </div>
            <h2 className="text-text mb-2 text-2xl font-black">
                {activeTab === "personal" ? t("personalTitle") : t("sharedTitle")}
            </h2>
            <p className="text-muted mb-8 font-bold">
                {activeTab === "personal" ? t("personalDescription") : t("sharedDescription")}
            </p>
            {activeTab === "personal" && (
                <Button
                    variant="primary"
                    color="purple"
                    onClick={() => router.push("/flashcard/create")}
                    icon={Plus}
                    className="mx-auto px-8 py-5 text-xl"
                >
                    {t("createDeck")}
                </Button>
            )}
        </div>
    );
};

export default DashboardEmpty;
