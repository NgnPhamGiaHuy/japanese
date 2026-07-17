"use client";

import React from "react";

import { X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

import { Button, Input, Textarea } from "@/shared/components/ui";

import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import type { LessonMetadataInput } from "@/shared/schemas";

interface LessonBuilderMetaProps {
    register: UseFormRegister<LessonMetadataInput>;
    formErrors: FieldErrors<LessonMetadataInput>;
    setFormValue: UseFormSetValue<LessonMetadataInput>;
    categories: string[];
    tagInput: string;
    setTagInput: (val: string) => void;
    addTag: (val: string) => void;
    removeCategory: (cat: string) => void;
    themeHex: string;
    saving: boolean;
}

const LessonBuilderMeta: React.FC<LessonBuilderMetaProps> = ({
    register,
    formErrors,
    setFormValue,
    categories,
    tagInput,
    setTagInput,
    addTag,
    removeCategory,
    themeHex,
    saving,
}) => {
    return (
        <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 rounded-3xl border-2 border-b-8 border-gray-200 bg-white p-4 shadow-sm sm:rounded-4xl sm:p-6"
        >
            <div>
                <Input
                    variant="underline"
                    type="text"
                    placeholder="Deck Title ✱ (e.g. JLPT N5 Verbs)"
                    className="text-2xl sm:text-3xl"
                    disabled={saving}
                    aria-invalid={!!formErrors.title}
                    aria-describedby={formErrors.title ? "lesson-title-error" : undefined}
                    {...register("title")}
                />
                {formErrors.title && (
                    <p id="lesson-title-error" role="alert" className="mt-1 text-xs text-red-500">
                        {formErrors.title.message}
                    </p>
                )}
            </div>
            <Textarea
                variant="underline"
                placeholder="Describe what this deck is about..."
                className="h-16 sm:h-20"
                disabled={saving}
                aria-invalid={!!formErrors.description}
                aria-describedby={formErrors.description ? "lesson-description-error" : undefined}
                {...register("description")}
            />
            {formErrors.description && (
                <p id="lesson-description-error" role="alert" className="mt-1 text-xs text-red-500">
                    {formErrors.description.message}
                </p>
            )}

            <div className="pt-2">
                <div className="mb-4 flex flex-wrap gap-2 sm:gap-2.5">
                    <AnimatePresence>
                        {categories.map((cat: string) => (
                            <m.div
                                key={cat}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                onClick={() => {
                                    setTagInput(cat);
                                    removeCategory(cat);
                                }}
                                className="group flex cursor-pointer items-center gap-2 rounded-xl border-b-4 border-black/10 px-3 py-1.5 text-xs font-black tracking-widest text-white shadow-sm transition-all hover:-translate-y-0.5 sm:rounded-2xl sm:px-3.5 sm:py-2 sm:text-xs"
                                style={{ backgroundColor: themeHex }}
                            >
                                <span className="opacity-60">TYPE:</span>
                                {cat.toUpperCase()}
                                <Button
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeCategory(cat);
                                    }}
                                    className="!h-auto !w-auto !p-0.5 text-white/50 transition-colors hover:text-white"
                                    disabled={saving}
                                    icon={X}
                                    iconSize={12}
                                />
                            </m.div>
                        ))}
                    </AnimatePresence>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center">
                        <span className="text-xs font-black tracking-widest text-gray-300 uppercase sm:text-xs">
                            Suggestions:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {["Vocabulary", "Grammar", "Kanji"].map((sug) => (
                                <button
                                    key={sug}
                                    type="button"
                                    disabled={saving || categories.includes(sug.toLowerCase())}
                                    onClick={() => addTag(sug)}
                                    className="focus-visible:ring-katakana rounded-lg border-b-2 border-gray-200 bg-white px-2.5 py-1 text-xs font-black tracking-widest text-gray-500 uppercase transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-30 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs"
                                >
                                    {sug}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder='Type "Kanji" or custom tags...'
                            value={tagInput}
                            className="text-text w-full rounded-xl border-2 border-b-4 border-gray-100 bg-gray-50/50 px-4 py-3 text-sm font-bold placeholder-gray-300 transition-all outline-none focus:border-[var(--theme-color)] focus:bg-white focus:ring-4 focus:ring-[var(--theme-color)]/5 sm:rounded-2xl sm:px-5 sm:py-3.5"
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addTag(tagInput)}
                            disabled={saving}
                        />
                        <div className="absolute top-1/2 right-4 -translate-y-1/2 text-xs font-black tracking-widest text-gray-400 uppercase sm:right-5 sm:text-xs">
                            ENTER TO ADD
                        </div>
                    </div>
                </div>

                {/* Theme Picker */}
                <div className="mt-6 border-t-2 border-gray-100 pt-6">
                    <label className="mb-3 block text-xs font-black tracking-wider text-gray-400 uppercase sm:text-xs">
                        Theme Color
                    </label>
                    <div className="flex flex-wrap gap-2.5 sm:gap-3">
                        {["#1cb0f6", "#58cc02", "#ff9600", "#ce82ff", "#ea2b2b", "#ff66bb"].map(
                            (color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() =>
                                        setFormValue("themeColor", color, { shouldDirty: true })
                                    }
                                    className={`focus-visible:ring-katakana h-9 w-9 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-10 sm:w-10 ${
                                        themeHex === color ? "border-black" : "border-transparent"
                                    }`}
                                    style={{ backgroundColor: color }}
                                />
                            ),
                        )}
                    </div>
                </div>
            </div>
        </m.div>
    );
};

export default LessonBuilderMeta;
