"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

import { FileUp, ImageIcon, Loader2, Sparkles, X } from "lucide-react";

import { Button } from "@/shared/components/ui";

interface ImportDropzoneProps {
    onFilesSelected: (files: File[]) => void;
    onClear: () => void;
    selectedFiles: File[];
    loading?: boolean;
    themeColor: string;
}

const ImportDropzone: React.FC<ImportDropzoneProps> = ({
    onFilesSelected,
    onClear,
    selectedFiles,
    loading,
    themeColor,
}) => {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            onFilesSelected(acceptedFiles);
        },
        [onFilesSelected],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".jpeg", ".jpg", ".png", ".webp"],
            "text/csv": [".csv"],
            "text/plain": [".txt"],
        },
    });

    if (selectedFiles.length > 0) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {selectedFiles.map((file, i) => (
                        <div
                            key={i}
                            className="group relative aspect-square overflow-hidden rounded-[2rem] border-2 border-gray-100 bg-white p-1 shadow-sm transition-all hover:border-[var(--theme-color)]/30 hover:shadow-md"
                            style={{ "--theme-color": themeColor } as React.CSSProperties}
                        >
                            <div className="h-full w-full overflow-hidden rounded-[1.5rem] bg-gray-50">
                                {file.type.startsWith("image/") ? (
                                    <img
                                        src={URL.createObjectURL(file)}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                                        <div className="mb-2 rounded-xl bg-white p-2 text-[var(--theme-color)] shadow-sm">
                                            <FileUp size={20} />
                                        </div>
                                        <p className="w-full truncate px-2 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                            {file.name.split(".").pop()}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                <p className="px-2 text-center text-[8px] font-black text-white uppercase">
                                    {file.name}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="secondary"
                        onClick={onClear}
                        disabled={loading}
                        className="flex-1 !rounded-2xl !py-4 text-xs font-black tracking-widest uppercase shadow-sm"
                    >
                        Reset Selection
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={`group relative flex cursor-pointer flex-col items-center justify-center space-y-4 rounded-[2.5rem] border-4 border-dashed p-16 text-center transition-all ${
                isDragActive
                    ? "scale-[1.01] border-[var(--theme-color)] bg-[var(--theme-color)]/5 ring-4 ring-[var(--theme-color)]/10"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
            }`}
            style={{ "--theme-color": themeColor } as React.CSSProperties}
        >
            <input {...getInputProps()} />

            <div
                className={`flex h-20 w-20 items-center justify-center rounded-[2rem] shadow-xl transition-all duration-500 group-hover:rotate-6 ${
                    isDragActive
                        ? "scale-110 bg-[var(--theme-color)] text-white"
                        : "border border-gray-100 bg-white text-[var(--theme-color)]"
                }`}
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50/80">
                    <FileUp
                        size={32}
                        className="transition-transform duration-500 group-hover:scale-110"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <p className="text-xl font-black text-[#3c3c3c]">Drop anything here</p>
                <p className="max-w-[200px] text-xs leading-relaxed font-bold text-[#afafaf]">
                    Images (Vision OCR) or CSV/TXT files (Instant Sync)
                </p>
            </div>

            {/* Premium Glow Effect during drag */}
            {isDragActive && (
                <div className="pointer-events-none absolute inset-0 -z-10 animate-pulse rounded-[2.5rem] bg-[var(--theme-color)]/5 blur-xl" />
            )}
        </div>
    );
};

export default ImportDropzone;
