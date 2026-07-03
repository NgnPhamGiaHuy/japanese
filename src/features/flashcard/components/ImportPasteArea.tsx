"use client";

import React from "react";

import { Sparkles } from "lucide-react";

interface ImportPasteAreaProps {
    value: string;
    onChange: (val: string) => void;
    themeColor: string;
}

const ImportPasteArea: React.FC<ImportPasteAreaProps> = ({ value, onChange, themeColor }) => {
    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-gray-100 bg-gradient-to-br from-white to-gray-50/50 p-8 shadow-sm">
                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <span
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase"
                            style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}
                        >
                            <Sparkles size={12} />
                            Real-time Engine
                        </span>
                        <h3 className="text-xl font-black text-[#3c3c3c]">
                            Dynamic Synchronization
                        </h3>
                        <p className="max-w-md text-sm leading-relaxed font-bold text-[#afafaf]">
                            Each line is instantly parsed into a flashcard. Commas, tabs, and
                            hyphens are detected automatically for flawless mapping.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: "Expression", hint: "Col 1" },
                            { label: "Alternative", hint: "Col 2" },
                            { label: "Meaning", hint: "Col 3" },
                            { label: "Example", hint: "Col 4" },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="flex min-w-[90px] flex-col items-center gap-0.5 rounded-xl border border-gray-200/50 bg-white px-3 py-2 shadow-sm"
                            >
                                <span
                                    className="text-[9px] font-black tracking-widest uppercase"
                                    style={{ color: themeColor }}
                                >
                                    {item.label}
                                </span>
                                <span className="text-[7px] font-black text-[#afafaf] uppercase">
                                    {item.hint}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    className="pointer-events-none absolute -right-4 -bottom-4 h-32 w-32 rounded-full opacity-20 blur-3xl"
                    style={{ backgroundColor: themeColor }}
                />
            </div>

            <div className="group relative">
                <textarea
                    className="h-80 w-full rounded-[2rem] border-2 border-gray-100 bg-white p-8 font-bold text-[#3c3c3c] shadow-inner transition-all outline-none focus:border-[var(--theme-color)] focus:ring-4 focus:ring-[var(--theme-color)]/5 sm:text-lg"
                    style={{ "--theme-color": themeColor } as React.CSSProperties}
                    placeholder={`[ {"primary": "食べる", "meaning": "to eat"} ]\n\nOR\n\n食べる, taberu, to eat, example`}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                <div className="pointer-events-none absolute right-4 bottom-4 flex items-center gap-2 rounded-2xl bg-gray-50/80 px-4 py-2 text-[10px] font-black tracking-widest text-[#afafaf] uppercase shadow-sm outline outline-1 outline-gray-200/50 sm:right-6 sm:bottom-6">
                    <div
                        className="h-2 w-2 animate-pulse rounded-full"
                        style={{ backgroundColor: themeColor }}
                    />
                    Live Sync Active
                </div>
            </div>
        </div>
    );
};

export default ImportPasteArea;
