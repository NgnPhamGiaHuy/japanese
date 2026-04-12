"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

import { Button } from "@/shared/components/ui";

import type { FlashCard, Lesson } from "../types/flashcard.types";

interface LessonBuilderProps {
    lessons: Lesson[];
    onSave: (lesson: Lesson) => void;
    onDelete?: (id: string) => void;
    onClose: () => void;
    editingLesson?: Lesson | null;
}

const makeCard = (): FlashCard => {
    return {
        id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        kanji: "",
        furigana: "",
        meaning: "",
        example: "",
        correctCount: 0,
        wrongCount: 0,
    };
};

const LessonBuilder = ({ onSave, onDelete, onClose, editingLesson }: LessonBuilderProps) => {
    const [lesson, setLesson] = useState<Lesson>(
        () =>
            editingLesson ?? {
                id: `l_${Date.now()}`,
                title: "",
                description: "",
                tags: [],
                createdAt: Date.now(),
                cards: [],
            },
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
            cards: lesson.cards.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
        });

    return (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#F7F7F8]">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-gray-200 bg-white/90 px-4 py-4 backdrop-blur-md">
                <Button variant="ghost" onClick={onClose} icon={X} className="px-3 py-2" />
                <h2 className="text-xl font-black text-[#3c3c3c]">
                    {editingLesson ? "Edit Deck" : "New Deck"}
                </h2>
                <Button
                    variant="primary"
                    color="blue"
                    onClick={handleSave}
                    className="px-6 py-2 text-sm"
                >
                    Save
                </Button>
            </header>

            <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 p-6">
                {/* Meta */}
                <div className="space-y-4 rounded-[2rem] border-2 border-b-8 border-gray-200 bg-white p-6 shadow-sm">
                    <input
                        type="text"
                        placeholder="Deck Title (e.g. JLPT N5 Verbs)"
                        className="w-full border-b-2 border-transparent bg-transparent pb-2 text-3xl font-black text-[#3c3c3c] placeholder-gray-300 transition-colors outline-none focus:border-[#1cb0f6]"
                        value={lesson.title}
                        onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
                        autoFocus={!editingLesson}
                    />
                    <textarea
                        placeholder="Describe what this deck is about..."
                        className="h-20 w-full resize-none border-b-2 border-transparent bg-transparent font-bold text-[#afafaf] placeholder-gray-300 transition-colors outline-none focus:border-[#1cb0f6]"
                        value={lesson.description}
                        onChange={(e) =>
                            setLesson({
                                ...lesson,
                                description: e.target.value,
                            })
                        }
                    />
                    <div className="pt-2">
                        <div className="mb-3 flex flex-wrap gap-2">
                            {lesson.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-black text-[#afafaf] uppercase"
                                >
                                    {tag}
                                    <button
                                        onClick={() =>
                                            setLesson({
                                                ...lesson,
                                                tags: lesson.tags.filter((t) => t !== tag),
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
                            className="w-full max-w-xs rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-bold placeholder-gray-300 transition-colors outline-none focus:border-[#1cb0f6]"
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={addTag}
                        />
                    </div>
                </div>

                {/* Cards */}
                <div>
                    <div className="mb-4 flex items-end justify-between px-2">
                        <h3 className="text-2xl font-black text-[#3c3c3c]">
                            Cards ({lesson.cards.length})
                        </h3>
                        <button
                            onClick={() =>
                                setLesson({
                                    ...lesson,
                                    cards: [...lesson.cards, makeCard()],
                                })
                            }
                            className="flex items-center gap-1 text-sm font-black text-[#1cb0f6] hover:text-[#149fdf]"
                        >
                            <Plus size={18} strokeWidth={3} /> Add Card
                        </button>
                    </div>
                    <div className="space-y-6">
                        {lesson.cards.map((card, idx) => (
                            <div
                                key={card.id}
                                className="group relative rounded-[2rem] border-2 border-b-8 border-gray-200 bg-white p-6 shadow-sm transition-colors focus-within:border-[#1cb0f6]"
                            >
                                <div className="absolute -top-3 -left-3 flex h-10 w-10 -rotate-3 transform items-center justify-center rounded-xl border-b-4 border-black bg-[#3c3c3c] text-lg font-black text-white shadow-sm">
                                    {idx + 1}
                                </div>
                                <button
                                    onClick={() =>
                                        setLesson({
                                            ...lesson,
                                            cards: lesson.cards.filter((c) => c.id !== card.id),
                                        })
                                    }
                                    className="absolute top-4 right-4 p-2 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#ea2b2b]"
                                >
                                    <Trash2 size={24} strokeWidth={2.5} />
                                </button>
                                <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {(["kanji", "furigana"] as const).map((field) => (
                                        <div key={field}>
                                            <label className="mb-1 block text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                                {field === "kanji" ? "Kanji / Word" : "Furigana"}
                                            </label>
                                            <input
                                                className={`w-full border-b-2 border-gray-100 bg-transparent pb-2 font-black text-[#3c3c3c] transition-colors outline-none focus:border-[#1cb0f6] ${field === "kanji" ? "text-3xl" : "text-xl font-bold"}`}
                                                placeholder={
                                                    field === "kanji" ? "食べる" : "たべる"
                                                }
                                                value={card[field]}
                                                onChange={(e) =>
                                                    updateCard(card.id, field, e.target.value)
                                                }
                                            />
                                        </div>
                                    ))}
                                    <div className="md:col-span-2">
                                        <label className="mb-1 block text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                            Meaning
                                        </label>
                                        <input
                                            className="w-full border-b-2 border-gray-100 bg-transparent pb-2 text-xl font-bold text-[#3c3c3c] transition-colors outline-none focus:border-[#1cb0f6]"
                                            placeholder="To eat"
                                            value={card.meaning}
                                            onChange={(e) =>
                                                updateCard(card.id, "meaning", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="mb-1 block text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                            Example Sentence (Optional)
                                        </label>
                                        <input
                                            className="w-full border-b-2 border-gray-100 bg-transparent pb-2 text-base font-bold text-gray-400 transition-colors outline-none focus:border-[#1cb0f6]"
                                            placeholder="りんごを食べる。"
                                            value={card.example}
                                            onChange={(e) =>
                                                updateCard(card.id, "example", e.target.value)
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
                                className="cursor-pointer rounded-[2rem] border-4 border-dashed border-gray-300 p-12 text-center text-lg font-bold text-[#afafaf] transition-colors hover:border-[#1cb0f6] hover:bg-white hover:text-[#1cb0f6]"
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
};

export default LessonBuilder;
