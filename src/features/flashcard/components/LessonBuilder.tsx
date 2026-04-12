"use client";

import { useState } from "react";
import type { Lesson, FlashCard } from "../types/flashcard.types";
import { Button } from "@/shared/components/ui";
import { Trash2, Plus, X } from "lucide-react";

interface LessonBuilderProps {
    lessons: Lesson[];
    onSave: (lesson: Lesson) => void;
    onDelete?: (id: string) => void;
    onClose: () => void;
    editingLesson?: Lesson | null;
}

function makeCard(): FlashCard {
    return {
        id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        kanji: "",
        furigana: "",
        meaning: "",
        example: "",
        correctCount: 0,
        wrongCount: 0,
    };
}

export default function LessonBuilder({
    onSave,
    onDelete,
    onClose,
    editingLesson,
}: LessonBuilderProps) {
    const [lesson, setLesson] = useState<Lesson>(
        () =>
            editingLesson ?? {
                id: `l_${Date.now()}`,
                title: "",
                description: "",
                tags: [],
                createdAt: Date.now(),
                cards: [],
            }
    );
    const [tagInput, setTagInput] = useState("");

    const handleSave = () => {
        if (!lesson.title.trim()) {
            alert("Title is required");
            return;
        }
        onSave(lesson);
    };

    const addTag = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && tagInput.trim()) {
            if (!lesson.tags.includes(tagInput.trim()))
                setLesson({
                    ...lesson,
                    tags: [...lesson.tags, tagInput.trim()],
                });
            setTagInput("");
        }
    };

    const updateCard = (id: string, field: keyof FlashCard, value: string) =>
        setLesson({
            ...lesson,
            cards: lesson.cards.map((c) =>
                c.id === id ? { ...c, [field]: value } : c
            ),
        });

    return (
        <div className="fixed inset-0 bg-[#F7F7F8] z-50 overflow-y-auto flex flex-col">
            <header className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-4 py-4 border-b-2 border-gray-200 flex justify-between items-center">
                <Button
                    variant="ghost"
                    onClick={onClose}
                    icon={X}
                    className="px-3 py-2"
                />
                <h2 className="font-black text-xl text-[#3c3c3c]">
                    {editingLesson ? "Edit Deck" : "New Deck"}
                </h2>
                <Button
                    variant="primary"
                    color="blue"
                    onClick={handleSave}
                    className="py-2 px-6 text-sm"
                >
                    Save
                </Button>
            </header>

            <div className="p-6 max-w-2xl mx-auto w-full space-y-8 flex-1">
                {/* Meta */}
                <div className="space-y-4 bg-white p-6 rounded-[2rem] border-2 border-b-8 border-gray-200 shadow-sm">
                    <input
                        type="text"
                        placeholder="Deck Title (e.g. JLPT N5 Verbs)"
                        className="w-full text-3xl font-black placeholder-gray-300 text-[#3c3c3c] outline-none bg-transparent border-b-2 border-transparent focus:border-[#1cb0f6] pb-2 transition-colors"
                        value={lesson.title}
                        onChange={(e) =>
                            setLesson({ ...lesson, title: e.target.value })
                        }
                        autoFocus={!editingLesson}
                    />
                    <textarea
                        placeholder="Describe what this deck is about..."
                        className="w-full text-[#afafaf] font-bold placeholder-gray-300 outline-none bg-transparent resize-none h-20 border-b-2 border-transparent focus:border-[#1cb0f6] transition-colors"
                        value={lesson.description}
                        onChange={(e) =>
                            setLesson({
                                ...lesson,
                                description: e.target.value,
                            })
                        }
                    />
                    <div className="pt-2">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {lesson.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-3 py-1.5 bg-gray-100 text-[#afafaf] text-xs rounded-xl font-black uppercase flex items-center gap-2 border-2 border-gray-200"
                                >
                                    {tag}
                                    <button
                                        onClick={() =>
                                            setLesson({
                                                ...lesson,
                                                tags: lesson.tags.filter(
                                                    (t) => t !== tag
                                                ),
                                            })
                                        }
                                        className="hover:text-[#ea2b2b]"
                                    >
                                        <X size={14} strokeWidth={3} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Add tag and press Enter..."
                            value={tagInput}
                            className="text-sm font-bold outline-none placeholder-gray-300 bg-white border-2 border-gray-200 px-4 py-3 rounded-xl w-full max-w-xs focus:border-[#1cb0f6] transition-colors"
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={addTag}
                        />
                    </div>
                </div>

                {/* Cards */}
                <div>
                    <div className="flex justify-between items-end mb-4 px-2">
                        <h3 className="font-black text-2xl text-[#3c3c3c]">
                            Cards ({lesson.cards.length})
                        </h3>
                        <button
                            onClick={() =>
                                setLesson({
                                    ...lesson,
                                    cards: [...lesson.cards, makeCard()],
                                })
                            }
                            className="text-[#1cb0f6] font-black text-sm flex items-center gap-1 hover:text-[#149fdf]"
                        >
                            <Plus size={18} strokeWidth={3} /> Add Card
                        </button>
                    </div>
                    <div className="space-y-6">
                        {lesson.cards.map((card, idx) => (
                            <div
                                key={card.id}
                                className="bg-white border-2 border-b-8 border-gray-200 rounded-[2rem] p-6 shadow-sm relative group focus-within:border-[#1cb0f6] transition-colors"
                            >
                                <div className="absolute -left-3 -top-3 w-10 h-10 bg-[#3c3c3c] text-white rounded-xl font-black flex items-center justify-center text-lg border-b-4 border-black shadow-sm transform -rotate-3">
                                    {idx + 1}
                                </div>
                                <button
                                    onClick={() =>
                                        setLesson({
                                            ...lesson,
                                            cards: lesson.cards.filter(
                                                (c) => c.id !== card.id
                                            ),
                                        })
                                    }
                                    className="absolute right-4 top-4 text-gray-300 hover:text-[#ea2b2b] opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                >
                                    <Trash2 size={24} strokeWidth={2.5} />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    {(["kanji", "furigana"] as const).map(
                                        (field) => (
                                            <div key={field}>
                                                <label className="text-[10px] uppercase font-black text-[#afafaf] tracking-widest mb-1 block">
                                                    {field === "kanji"
                                                        ? "Kanji / Word"
                                                        : "Furigana"}
                                                </label>
                                                <input
                                                    className={`w-full font-black text-[#3c3c3c] outline-none border-b-2 border-gray-100 focus:border-[#1cb0f6] pb-2 transition-colors bg-transparent ${field === "kanji" ? "text-3xl" : "text-xl font-bold"}`}
                                                    placeholder={
                                                        field === "kanji"
                                                            ? "食べる"
                                                            : "たべる"
                                                    }
                                                    value={card[field]}
                                                    onChange={(e) =>
                                                        updateCard(
                                                            card.id,
                                                            field,
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                        )
                                    )}
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] uppercase font-black text-[#afafaf] tracking-widest mb-1 block">
                                            Meaning
                                        </label>
                                        <input
                                            className="w-full text-xl font-bold text-[#3c3c3c] outline-none border-b-2 border-gray-100 focus:border-[#1cb0f6] pb-2 transition-colors bg-transparent"
                                            placeholder="To eat"
                                            value={card.meaning}
                                            onChange={(e) =>
                                                updateCard(
                                                    card.id,
                                                    "meaning",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] uppercase font-black text-[#afafaf] tracking-widest mb-1 block">
                                            Example Sentence (Optional)
                                        </label>
                                        <input
                                            className="w-full text-base font-bold text-gray-400 outline-none border-b-2 border-gray-100 focus:border-[#1cb0f6] pb-2 transition-colors bg-transparent"
                                            placeholder="りんごを食べる。"
                                            value={card.example}
                                            onChange={(e) =>
                                                updateCard(
                                                    card.id,
                                                    "example",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {lesson.cards.length === 0 && (
                            <div
                                onClick={() =>
                                    setLesson({
                                        ...lesson,
                                        cards: [makeCard()],
                                    })
                                }
                                className="border-4 border-dashed border-gray-300 rounded-[2rem] p-12 text-center text-[#afafaf] cursor-pointer hover:bg-white hover:border-[#1cb0f6] hover:text-[#1cb0f6] transition-colors font-bold text-lg"
                            >
                                <Plus
                                    size={48}
                                    className="mx-auto mb-4 opacity-50"
                                    strokeWidth={2.5}
                                />
                                <p>Click to add your first card</p>
                            </div>
                        )}
                    </div>
                </div>

                {editingLesson && onDelete && (
                    <div className="pt-8 pb-12">
                        <Button
                            variant="secondary"
                            color="red"
                            onClick={() => {
                                if (confirm("Delete this deck?")) {
                                    onDelete(editingLesson.id);
                                    onClose();
                                }
                            }}
                            className="w-full text-lg"
                        >
                            Delete Deck
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
