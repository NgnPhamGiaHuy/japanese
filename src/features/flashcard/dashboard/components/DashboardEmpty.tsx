import { useRouter } from "next/navigation";

import { BookOpen, Plus, Sparkles } from "lucide-react";

import { Button } from "@/shared/components/ui";

interface DashboardEmptyProps {
    activeTab: "personal" | "shared" | "discover";
}

const DashboardEmpty = ({ activeTab }: DashboardEmptyProps) => {
    const router = useRouter();

    if (activeTab === "discover") {
        return (
            <div className="py-20 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-[2rem] border-b-8 border-[#46a302] bg-[#58cc02] text-white shadow-sm">
                    <Sparkles size={48} strokeWidth={3} />
                </div>
                <h2 className="mb-2 text-2xl font-black text-[#3c3c3c]">No public decks yet</h2>
                <p className="font-bold text-[#afafaf]">
                    Public decks from other learners will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="py-20 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-[2rem] border-b-8 border-[#b65ce8] bg-[#ce82ff] text-white shadow-sm">
                <BookOpen size={48} strokeWidth={3} />
            </div>
            <h2 className="mb-2 text-2xl font-black text-[#3c3c3c]">
                {activeTab === "personal" ? "No decks yet" : "No shared decks"}
            </h2>
            <p className="mb-8 font-bold text-[#afafaf]">
                {activeTab === "personal"
                    ? "Create your first vocabulary deck to get started!"
                    : "Shared decks from other students will appear here."}
            </p>
            {activeTab === "personal" && (
                <Button
                    variant="primary"
                    color="purple"
                    onClick={() => router.push("/flashcard/create")}
                    icon={Plus}
                    className="mx-auto px-8 py-5 text-xl"
                >
                    Create Deck
                </Button>
            )}
        </div>
    );
};

export default DashboardEmpty;
