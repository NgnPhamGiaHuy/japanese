"use client";

import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/shared/components/ui";

interface LessonBuilderMetaProps {
    lesson: any;
    setLesson: (lesson: any) => void;
    tagInput: string;
    setTagInput: (val: string) => void;
    addTag: (val: string) => void;
    removeCategory: (cat: string) => void;
    themeHex: string;
    saving: boolean;
}

export const LessonBuilderMeta: React.FC<LessonBuilderMetaProps> = ({
    lesson,
    setLesson,
    tagInput,
    setTagInput,
    addTag,
    removeCategory,
    themeHex,
    saving,
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 rounded-[2rem] border-2 border-b-8 border-gray-200 bg-white p-6 shadow-sm"
        >
            <input
                type="text"
                placeholder="Deck Title ✱ (e.g. JLPT N5 Verbs)"
                className="w-full border-b-2 border-transparent bg-transparent pb-2 text-3xl font-black text-[#3c3c3c] placeholder-gray-300 transition-colors outline-none focus:border-[var(--theme-color)]"
                value={lesson.title}
                onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
                disabled={saving}
            />
            <textarea
                placeholder="Describe what this deck is about..."
                className="h-20 w-full resize-none border-b-2 border-transparent bg-transparent font-bold text-[#afafaf] placeholder-gray-300 transition-colors outline-none focus:border-[var(--theme-color)]"
                value={lesson.description}
                onChange={(e) => setLesson({ ...lesson, description: e.target.value })}
                disabled={saving}
            />

            <div className="pt-2">
                <div className="mb-4 flex flex-wrap gap-2.5">
                    <AnimatePresence>
                        {(lesson.categories || []).map((cat: string) => (
                            <motion.div
                                key={cat}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                onClick={() => {
                                    setTagInput(cat);
                                    removeCategory(cat);
                                }}
                                className="group flex cursor-pointer items-center gap-2 rounded-2xl border-b-4 border-black/10 px-3.5 py-2 text-[10px] font-black tracking-widest text-white shadow-sm transition-all hover:-translate-y-0.5"
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
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <span className="text-[10px] font-black tracking-widest text-gray-300 uppercase">Suggestions:</span>
                        <div className="flex flex-wrap gap-1.5">
                            {["Vocabulary", "Grammar", "Kanji"].map((sug) => (
                                <button
                                    key={sug}
                                    type="button"
                                    disabled={saving || lesson.categories?.includes(sug.toLowerCase())}
                                    onClick={() => addTag(sug)}
                                    className="rounded-xl border-b-2 border-gray-200 bg-white px-3 py-1.5 text-[10px] font-black tracking-widest text-gray-500 uppercase transition-all hover:-translate-y-0.5 disabled:opacity-30"
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
                            className="w-full rounded-2xl border-2 border-b-4 border-gray-100 bg-gray-50/50 px-5 py-3.5 text-sm font-bold text-[#3c3c3c] placeholder-gray-300 transition-all outline-none focus:border-[var(--theme-color)] focus:bg-white focus:ring-4 focus:ring-[var(--theme-color)]/5"
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addTag(tagInput)}
                            disabled={saving}
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black tracking-widest text-gray-400 uppercase">
                            ENTER TO ADD
                        </div>
                    </div>
                </div>

                {/* Theme Picker */}
                <div className="border-t-2 border-gray-100 pt-6 mt-6">
                    <label className="mb-3 block text-xs font-black tracking-wider text-gray-400 uppercase">Theme Color</label>
                    <div className="flex flex-wrap gap-3">
                        {["#1cb0f6", "#58cc02", "#ff9600", "#ce82ff", "#ea2b2b", "#ff66bb"].map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setLesson({ ...lesson, themeColor: color })}
                                className={`h-10 w-10 rounded-full border-[3px] transition-all hover:scale-110 ${
                                    (lesson.themeColor || "#1cb0f6") === color ? "border-black" : "border-transparent"
                                }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
