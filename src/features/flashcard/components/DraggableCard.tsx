"use client";

import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, Image as ImageIcon, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui";

import type { EditorCard } from "../types";

interface DraggableCardProps {
    card: EditorCard;
    idx: number;
    saving: boolean;
    themeHex: string;
    aiLoading: boolean;
    aiError?: string;
    onRemove: (id: string) => void;
    onUpdate: (id: string, field: keyof EditorCard, value: any) => void;
    onAIFill: (id: string, word: string) => void;
    onImageChange: (file: File | null, id: string) => void;
    onImageClear: (path: string) => void;
}

/**
 * DraggableCard Component
 * Isolated item for Reorder.Group to allow useDragControls for a dedicated handle.
 */
const DraggableCard = ({
    card,
    idx,
    saving,
    themeHex,
    aiLoading,
    aiError,
    onRemove,
    onUpdate,
    onAIFill,
    onImageChange,
    onImageClear,
}: DraggableCardProps) => {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            value={card}
            dragListener={false}
            dragControls={dragControls}
            className="group relative rounded-[2rem] border-2 border-b-8 border-gray-200 bg-white p-6 shadow-sm transition-colors select-none focus-within:border-[var(--theme-color)]"
        >
            {/* Index Badge */}
            <div className="absolute -top-3 -left-3 flex h-10 w-10 -rotate-3 transform items-center justify-center rounded-xl border-b-4 border-black bg-[#3c3c3c] text-lg font-black text-white shadow-sm transition-all group-active:scale-110">
                {idx + 1}
            </div>

            {/* Drag Handle */}
            <div
                onPointerDown={(e) => dragControls.start(e)}
                className="absolute top-1/2 -left-8 -translate-y-1/2 cursor-grab opacity-0 transition-all group-hover:opacity-100 hover:scale-110 active:cursor-grabbing md:-left-10"
            >
                <GripVertical size={24} className="text-gray-300 hover:text-gray-500" />
            </div>

            {/* Remove Button */}
            <Button
                variant="primary"
                color="red"
                onClick={() => onRemove(card.id)}
                disabled={saving}
                className="absolute -top-3 -right-3 z-10 !h-10 !w-10 rotate-3 transform !p-1 opacity-100 transition-all hover:scale-110 active:scale-95 md:opacity-0 md:group-hover:opacity-100"
                title="Remove Card"
                icon={Trash2}
                iconSize={22}
            />

            <div className="mt-4 grid grid-cols-1 gap-6 select-text md:grid-cols-2">
                {/* Primary Word */}
                <div className="md:col-span-2">
                    <div className="mb-1 flex items-center justify-between">
                        <label className="text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                            Primary ✱
                        </label>
                        <Button
                            variant="ghost"
                            title={card.primary?.trim() ? "Auto-fill with AI" : "Type a word first"}
                            loading={aiLoading}
                            disabled={saving || !card.primary?.trim()}
                            onClick={() => onAIFill(card.id, card.primary || "")}
                            className="!flex !h-auto !items-center !gap-1 !px-2 !py-0.5 !text-[9px] !font-black uppercase shadow-none hover:shadow-none"
                            color={themeHex}
                            icon={Sparkles}
                            iconSize={10}
                        >
                            {aiLoading ? "Filling…" : "AI Fill"}
                        </Button>
                    </div>
                    <input
                        className={`w-full border-b-2 border-gray-100 bg-transparent pb-2 text-3xl font-black text-[#3c3c3c] transition-colors outline-none select-text focus:border-[var(--theme-color)] ${aiLoading ? "opacity-60" : ""}`}
                        placeholder="食べる / たべる"
                        value={card.primary || ""}
                        onChange={(e) => onUpdate(card.id, "primary", e.target.value)}
                        disabled={saving || aiLoading}
                    />
                    {aiError && (
                        <p className="mt-1 text-[10px] font-bold text-[#ea2b2b]">{aiError}</p>
                    )}
                </div>

                {/* Alternative Form */}
                {(["alternative"] as const).map((repKey) => (
                    <div key={repKey}>
                        <label className="mb-1 block text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                            Alternative
                        </label>
                        <input
                            className="w-full border-b-2 border-gray-100 bg-transparent pb-2 text-xl font-bold text-[#3c3c3c] transition-colors outline-none select-text focus:border-[var(--theme-color)]"
                            placeholder="Alternate form (optional)"
                            value={card.alternatives?.[0] || ""}
                            onChange={(e) =>
                                onUpdate(
                                    card.id,
                                    "alternatives",
                                    e.target.value ? [e.target.value] : [],
                                )
                            }
                            disabled={saving}
                        />
                    </div>
                ))}

                {/* Meaning */}
                <div className="md:col-span-2">
                    <label className="mb-1 block text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                        Meaning ✱
                    </label>
                    <input
                        className="w-full border-b-2 border-gray-100 bg-transparent pb-2 text-xl font-bold text-[#3c3c3c] transition-colors outline-none select-text focus:border-[var(--theme-color)]"
                        placeholder="To eat"
                        value={card.meaning}
                        onChange={(e) => onUpdate(card.id, "meaning", e.target.value)}
                        disabled={saving}
                    />
                </div>

                {/* Example Sentence */}
                <div className="md:col-span-2">
                    <label className="mb-1 block text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                        Example Sentence (Optional)
                    </label>
                    <input
                        className="w-full border-b-2 border-gray-100 bg-transparent pb-2 text-base font-bold text-[#3c3c3c] transition-colors outline-none select-text focus:border-[var(--theme-color)]"
                        placeholder="りんごを食べる。"
                        value={card.example}
                        onChange={(e) => onUpdate(card.id, "example", e.target.value)}
                        disabled={saving}
                    />
                </div>

                {/* Image Section */}
                <div className="md:col-span-2">
                    <label className="mb-1 block text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                        Card Image (Optional)
                    </label>
                    <div className="mt-2 flex items-center gap-4">
                        {card.previewUrl || card.imageUrl ? (
                            <div className="relative h-20 w-20 overflow-hidden rounded-xl border-2 border-gray-200">
                                <img
                                    key={card.previewUrl || card.imageUrl}
                                    src={card.previewUrl || card.imageUrl}
                                    alt="Card preview"
                                    className="h-full w-full object-cover"
                                    crossOrigin="anonymous"
                                    referrerPolicy="no-referrer"
                                />
                                <Button
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (card.imagePath) onImageClear(card.imagePath);
                                        onUpdate(card.id, "imageFile", undefined);
                                        onUpdate(card.id, "previewUrl", undefined);
                                        onUpdate(card.id, "imageUrl", undefined);
                                        onUpdate(card.id, "imagePath", undefined);
                                    }}
                                    disabled={saving}
                                    className="absolute inset-0 !flex !h-full !w-full !items-center !justify-center !rounded-xl !bg-black/50 !text-white opacity-0 shadow-none transition-opacity hover:opacity-100 hover:shadow-none active:translate-y-0"
                                    icon={Trash2}
                                    iconSize={24}
                                />
                            </div>
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400">
                                <ImageIcon size={24} />
                            </div>
                        )}
                        <div className="flex-1">
                            <input
                                type="file"
                                accept="image/*"
                                id={`img-upload-${card.id}`}
                                className="hidden"
                                disabled={saving}
                                onChange={(e) =>
                                    onImageChange(e.target.files?.[0] || null, card.id)
                                }
                            />
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    document.getElementById(`img-upload-${card.id}`)?.click();
                                }}
                                className="!rounded-xl !border-2 !border-gray-200 !bg-white !px-4 !py-2 !text-sm !font-bold !text-[#3c3c3c] shadow-sm hover:!bg-gray-50 active:translate-y-0"
                            >
                                {card.previewUrl || card.imageUrl ? "Change Image" : "Upload Image"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Reorder.Item>
    );
};

export default DraggableCard;
