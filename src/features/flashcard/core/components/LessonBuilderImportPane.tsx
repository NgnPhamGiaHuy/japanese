"use client";

import React, { useState } from "react";

import { FileUp, Sparkles } from "lucide-react";

import { AIBulkPanel, useAIImageDeck } from "@/features/ai";
import { Button, LoadingSpinner } from "@/shared/components/ui";
import ImportDropzone from "./ImportDropzone";
import ImportPasteArea from "./ImportPasteArea";
import ImportPreview from "./ImportPreview";

interface LessonBuilderImportPaneProps {
    inputMode: "ai" | "manual" | "paste" | "uploads";
    setInputMode: (mode: "ai" | "manual" | "paste" | "uploads") => void;
    previewRows: any[] | null;
    setPreviewRows: (rows: any[] | null) => void;
    pasteText: string;
    setPasteText: (text: string) => void;
    handleLiveSync: (text: string) => void;
    handleImportConfirm: (rows: any[]) => void;
    themeHex: string;
    existingWords: string[];
    saving: boolean;
    onAISuccess?: (title: string, description: string) => void;
}

const LessonBuilderImportPane: React.FC<LessonBuilderImportPaneProps> = ({
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
    onAISuccess,
}) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const imageAI = useAIImageDeck();

    const processFiles = async () => {
        const images = selectedFiles.filter((f) => f.type.startsWith("image/"));
        const others = selectedFiles.filter((f) => !f.type.startsWith("image/"));

        if (others.length > 0) {
            const { parseCSV } = await import("../utils/parser");
            const res = await parseCSV(others[0]);
            setPreviewRows([
                ...res.valid.map((r, i) => ({
                    id: `v_${Date.now()}_${i}`,
                    ...r,
                    isInvalid: false,
                })),
                ...res.invalid.map((r, i) => ({
                    id: `i_${Date.now()}_${i}`,
                    primary: r.row,
                    errorMsg: r.error,
                    isInvalid: true,
                })),
            ]);
        } else if (images.length > 0) {
            const result = await imageAI.generate(images, existingWords);
            if (result) {
                setPreviewRows(
                    result.cards.map((c, i) => ({
                        id: `img_${Date.now()}_${i}`,
                        primary: c.primary || "",
                        alternatives: c.alternatives || [],
                        meaning: c.meaning || "",
                        example: c.example || "",
                        isInvalid: !(c.primary?.trim() && (c.meaning || "").trim()),
                    })),
                );
                onAISuccess?.(result.title, result.description);
            }
        }
    };

    if (previewRows)
        return (
            <ImportPreview
                initialRows={previewRows}
                themeColor={themeHex}
                onCancel={() => {
                    setPreviewRows(null);
                    setSelectedFiles([]);
                }}
                onConfirm={handleImportConfirm}
            />
        );

    return (
        <div className="space-y-6">
            <div className="flex overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
                {(["ai", "manual", "paste", "uploads"] as const).map((mode) => (
                    <Button
                        key={mode}
                        variant="ghost"
                        onClick={() => {
                            setInputMode(mode);
                            setPreviewRows(null);
                        }}
                        className={`flex-1 !rounded-none !p-2.5 !text-[8px] !font-black uppercase sm:!p-4 sm:!text-[10px] ${inputMode === mode ? "!text-white" : "!text-gray-400 hover:bg-gray-50"}`}
                        style={inputMode === mode ? { backgroundColor: themeHex } : {}}
                        icon={mode === "ai" ? Sparkles : mode === "uploads" ? FileUp : undefined}
                    >
                        {mode === "ai" ? "TOPIC" : mode === "uploads" ? "UPLOADS" : mode}
                    </Button>
                ))}
            </div>

            {imageAI.loading && (
                <LoadingSpinner color={themeHex} label="Analyzing visual content..." />
            )}

            {inputMode === "uploads" && (
                <div className="space-y-6">
                    <div className="relative overflow-hidden rounded-3xl border-2 border-gray-100 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-sm sm:rounded-[2.5rem] sm:p-8">
                        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-2">
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black tracking-widest uppercase sm:px-3 sm:text-[10px]"
                                    style={{ backgroundColor: `${themeHex}1a`, color: themeHex }}
                                >
                                    <Sparkles size={10} className="sm:size-[12px]" />
                                    Advanced Processing
                                </span>
                                <h3 className="text-lg font-black text-[#3c3c3c] sm:text-xl">
                                    Multi-modal Ingestion
                                </h3>
                                <p className="max-w-md text-xs leading-relaxed font-bold text-[#afafaf] sm:text-sm">
                                    Our vision engine automatically extracts vocabulary from images
                                    while handling raw flat-files for instant synchronization.
                                </p>
                            </div>
                            <div className="flex gap-2.5 sm:gap-3">
                                <div
                                    className="group flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:h-14 sm:w-14 sm:rounded-2xl"
                                    style={{ backgroundColor: themeHex }}
                                >
                                    <Sparkles size={20} className="sm:size-[24px]" />
                                </div>
                                <div className="group flex h-12 w-12 items-center justify-center rounded-xl bg-[#58cc02] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:h-14 sm:w-14 sm:rounded-2xl">
                                    <FileUp size={20} className="sm:size-[24px]" />
                                </div>
                            </div>
                        </div>

                        {/* Decorative background elements */}
                        <div
                            className="pointer-events-none absolute -right-4 -bottom-4 h-24 w-24 rounded-full opacity-20 blur-2xl sm:h-32 sm:w-32 sm:blur-3xl"
                            style={{ backgroundColor: themeHex }}
                        />
                        <div className="pointer-events-none absolute -top-4 -left-4 h-24 w-24 rounded-full bg-[#58cc02]/5 blur-2xl sm:h-32 sm:w-32 sm:blur-3xl" />
                    </div>

                    <ImportDropzone
                        themeColor={themeHex}
                        selectedFiles={selectedFiles}
                        loading={imageAI.loading}
                        onFilesSelected={setSelectedFiles}
                        onClear={() => setSelectedFiles([])}
                    />
                    {selectedFiles.length > 0 && (
                        <Button
                            variant="primary"
                            onClick={processFiles}
                            loading={imageAI.loading}
                            disabled={saving}
                            color={themeHex}
                            className="w-full !rounded-2xl !py-6 !text-sm !font-black shadow-[0_8px_0_0_rgba(0,0,0,0.1)] active:translate-y-1 active:shadow-none"
                            icon={Sparkles}
                        >
                            {imageAI.loading
                                ? "Analyzing..."
                                : `Process ${selectedFiles.length} files`}
                        </Button>
                    )}
                </div>
            )}

            {inputMode === "ai" && (
                <AIBulkPanel
                    themeColor={themeHex}
                    existingWords={existingWords}
                    onPreview={setPreviewRows}
                />
            )}
            {inputMode === "paste" && (
                <ImportPasteArea
                    value={pasteText}
                    onChange={(v) => {
                        setPasteText(v);
                        handleLiveSync(v);
                    }}
                    themeColor={themeHex}
                />
            )}
        </div>
    );
};

export default LessonBuilderImportPane;
