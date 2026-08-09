"use client";

import { useTranslations } from "next-intl";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Image as ImageIcon, Sparkles, Trash2 } from "lucide-react";

import { Button, Input } from "@/shared/components/ui";
import { joinAlternatives, splitAlternatives } from "../../utils/formatting";

import type { EditorCard } from "../../types";

interface DraggableCardProps {
    card: EditorCard;
    idx: number;
    saving: boolean;
    themeHex: string;
    aiLoading: boolean;
    aiError?: string;
    onRemove: (id: string) => void;
    onUpdate: <K extends keyof EditorCard>(id: string, field: K, value: EditorCard[K]) => void;
    onAIFill: (id: string, word: string) => void;
    onImageChange: (file: File | null, id: string) => void;
    onImageClear: (path: string) => void;
}

/**
 * DraggableCard Component
 * Isolated item for the lesson builder's sortable card list — a dedicated
 * grip handle (not the whole card) drives the drag, since the card is full
 * of real text inputs that need normal click/select/type behavior.
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
    const t = useTranslations("LessonBuilder");
    const tDetail = useTranslations("FlashcardDetail");
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: card.id,
        disabled: saving,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.72 : undefined,
    } as React.CSSProperties;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group relative rounded-3xl border-2 border-b-8 border-gray-200 bg-white p-4 shadow-sm transition-colors select-text focus-within:border-[var(--theme-color)] sm:rounded-4xl sm:p-6"
        >
            {!saving && (
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="focus-visible:ring-katakana absolute top-1/2 -left-8 -translate-y-1/2 cursor-pointer opacity-0 transition-all group-hover:opacity-100 hover:scale-110 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 active:cursor-grabbing md:-left-10"
                    aria-label={tDetail("reorderCard")}
                >
                    <GripVertical size={24} className="text-gray-300 hover:text-gray-500" />
                </button>
            )}

            {/* Index Badge */}
            <div className="absolute -top-2 -left-2 flex h-8 w-8 -rotate-3 transform items-center justify-center rounded-lg border-b-4 border-black bg-[#3c3c3c] text-sm font-black text-white shadow-sm transition-all group-active:scale-110 sm:-top-3 sm:-left-3 sm:h-10 sm:w-10 sm:rounded-xl sm:text-lg">
                {idx + 1}
            </div>

            {/* Remove Button */}
            <Button
                variant="primary"
                color="red"
                onClick={() => onRemove(card.id)}
                disabled={saving}
                className="absolute -top-2 -right-2 z-10 !h-8 !w-8 rotate-3 transform !p-1 opacity-100 transition-all hover:scale-110 active:scale-95 sm:-top-3 sm:-right-3 sm:!h-10 sm:!w-10 md:opacity-0 md:group-hover:opacity-100"
                title={t("removeCard")}
                icon={Trash2}
                iconSize={18}
            />

            <div className="mt-4 grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
                {/* Primary Word */}
                <div className="md:col-span-2">
                    <div className="mb-1 flex items-center justify-between">
                        <label className="text-muted text-xs font-black tracking-widest uppercase sm:text-xs">
                            {t("primaryLabel")}
                        </label>
                        <Button
                            variant="ghost"
                            title={card.primary?.trim() ? t("autoFillWithAI") : t("typeWordFirst")}
                            loading={aiLoading}
                            disabled={saving || !card.primary?.trim()}
                            onClick={() => onAIFill(card.id, card.primary || "")}
                            className="!flex !h-auto !items-center !gap-1 !px-2 !py-0.5 !text-[8.5px] !font-black uppercase shadow-none hover:shadow-none sm:!text-xs"
                            color={themeHex}
                            icon={Sparkles}
                            iconSize={10}
                        >
                            {aiLoading ? t("filling") : t("aiFill")}
                        </Button>
                    </div>
                    <Input
                        variant="underline"
                        className={`border-gray-100 pb-1 text-xl sm:pb-2 sm:text-3xl ${aiLoading ? "opacity-60" : ""}`}
                        placeholder={t("primaryPlaceholder")}
                        value={card.primary || ""}
                        onChange={(e) => onUpdate(card.id, "primary", e.target.value)}
                        disabled={saving || aiLoading}
                    />
                    {aiError && (
                        <p className="text-danger mt-1 text-xs font-bold sm:text-xs">{aiError}</p>
                    )}
                </div>

                {/* Alternative Form */}
                {(["alternative"] as const).map((repKey) => (
                    <div key={repKey}>
                        <label className="text-muted mb-1 block text-xs font-black tracking-widest uppercase sm:text-xs">
                            {t("alternativeLabel")}
                        </label>
                        <Input
                            variant="underline"
                            className="border-gray-100 pb-1 text-base font-bold sm:pb-2 sm:text-xl"
                            placeholder={t("alternateFormsPlaceholder")}
                            value={joinAlternatives(card.alternatives)}
                            onChange={(e) =>
                                onUpdate(card.id, "alternatives", splitAlternatives(e.target.value))
                            }
                            disabled={saving}
                        />
                    </div>
                ))}

                {/* Meaning */}
                <div className="md:col-span-2">
                    <label className="text-muted mb-1 block text-xs font-black tracking-widest uppercase sm:text-xs">
                        {t("meaningLabel")}
                    </label>
                    <Input
                        variant="underline"
                        className="border-gray-100 pb-1 text-base font-bold sm:pb-2 sm:text-xl"
                        placeholder={t("meaningPlaceholder")}
                        value={card.meaning}
                        onChange={(e) => onUpdate(card.id, "meaning", e.target.value)}
                        disabled={saving}
                    />
                </div>

                {/* Example Sentence */}
                <div className="md:col-span-2">
                    <label className="text-muted mb-1 block text-xs font-black tracking-widest uppercase sm:text-xs">
                        {t("exampleSentenceLabel")}
                    </label>
                    <Input
                        variant="underline"
                        className="border-gray-100 pb-1 text-sm font-bold sm:pb-2 sm:text-base"
                        placeholder="りんごを食べる。"
                        value={card.example}
                        onChange={(e) => onUpdate(card.id, "example", e.target.value)}
                        disabled={saving}
                    />
                </div>

                {/* Image Section */}
                <div className="md:col-span-2">
                    <label className="text-muted mb-1 block text-xs font-black tracking-widest uppercase">
                        {t("cardImageLabel")}
                    </label>
                    <div className="mt-2 flex items-center gap-4">
                        {card.previewUrl || card.imageUrl ? (
                            <div className="relative h-20 w-20 overflow-hidden rounded-xl border-2 border-gray-200">
                                <img
                                    key={card.previewUrl || card.imageUrl}
                                    src={card.previewUrl || card.imageUrl}
                                    alt={t("cardPreviewAlt")}
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
                                className="!text-text !rounded-xl !border-2 !border-gray-200 !bg-white !px-4 !py-2 !text-sm !font-bold shadow-sm hover:!bg-gray-50 active:translate-y-0"
                            >
                                {card.previewUrl || card.imageUrl
                                    ? t("changeImage")
                                    : t("uploadImage")}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DraggableCard;
