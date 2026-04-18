"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui";
import { ImportPreview } from "./ImportPreview";
// import AIBulkPanel from "./AIBulkPanel"; // Assuming it's in the same dir

interface LessonBuilderImportPaneProps {
    inputMode: "ai" | "manual" | "paste" | "file";
    setInputMode: (mode: "ai" | "manual" | "paste" | "file") => void;
    previewRows: any[] | null;
    setPreviewRows: (rows: any[] | null) => void;
    pasteText: string;
    setPasteText: (text: string) => void;
    handleLiveSync: (text: string) => void;
    handleImportConfirm: (rows: any[]) => void;
    themeHex: string;
    existingWords: string[];
    saving: boolean;
}

export const LessonBuilderImportPane: React.FC<LessonBuilderImportPaneProps> = ({
    inputMode,
    setInputMode,
    previewRows,
    setPreviewRows,
    pasteText,
    setPasteText,
    handleLiveSync,
    handleImportConfirm,
    themeHex,
    existingWords,
    saving,
}) => {
    return (
        <div className="space-y-6">
            <div className="flex overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
                {(["ai", "manual", "paste", "file"] as const).map((mode) => (
                    <Button
                        key={mode}
                        variant="ghost"
                        onClick={() => {
                            setInputMode(mode);
                            setPreviewRows(null);
                        }}
                        className={`flex-1 !rounded-none !p-4 !text-xs !font-black uppercase tracking-wider ${
                            inputMode === mode ? "!text-white" : "!text-gray-400 hover:bg-gray-50"
                        }`}
                        style={inputMode === mode ? { backgroundColor: themeHex } : {}}
                        icon={mode === "ai" ? Sparkles : undefined}
                    >
                        {mode === "ai" ? "AI GEN" : mode}
                    </Button>
                ))}
            </div>

            {previewRows ? (
                <ImportPreview
                    initialRows={previewRows}
                    themeColor={themeHex}
                    onCancel={() => setPreviewRows(null)}
                    onConfirm={handleImportConfirm}
                />
            ) : inputMode === "paste" ? (
                <div className="space-y-3">
                    <textarea
                        className="h-64 w-full rounded-2xl border-2 border-gray-100 bg-white p-5 font-bold text-[#3c3c3c] outline-none focus:border-[var(--theme-color)]"
                        placeholder="word,kana,meaning,example"
                        value={pasteText}
                        onChange={(e) => {
                            setPasteText(e.target.value);
                            handleLiveSync(e.target.value);
                        }}
                    />
                </div>
            ) : null}
        </div>
    );
};
