"use client";

import { useCallback, useEffect, useState } from "react";

import { DEFAULT_LESSONS } from "../data/defaultLessons";

import type { Lesson } from "../types/flashcard.types";

const STORAGE_KEY = "nihongo_lessons";

function load(): Lesson[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : DEFAULT_LESSONS;
    } catch {
        return DEFAULT_LESSONS;
    }
}

function save(lessons: Lesson[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
    } catch {}
}

/** Full CRUD for flashcard lessons with localStorage persistence */
export function useLessons() {
    const [lessons, setLessons] = useState<Lesson[]>(load);

    useEffect(() => {
        save(lessons);
    }, [lessons]);

    const createLesson = useCallback((lesson: Lesson) => {
        setLessons((prev) => [lesson, ...prev]);
    }, []);

    const updateLesson = useCallback((updated: Lesson) => {
        setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    }, []);

    const deleteLesson = useCallback((id: string) => {
        setLessons((prev) => prev.filter((l) => l.id !== id));
    }, []);

    const recordCardResult = useCallback((lessonId: string, cardId: string, knew: boolean) => {
        setLessons((prev) =>
            prev.map((l) => {
                if (l.id !== lessonId) return l;
                return {
                    ...l,
                    cards: l.cards.map((c) =>
                        c.id !== cardId
                            ? c
                            : {
                                  ...c,
                                  correctCount: knew ? c.correctCount + 1 : c.correctCount,
                                  wrongCount: !knew ? c.wrongCount + 1 : c.wrongCount,
                              },
                    ),
                };
            }),
        );
    }, []);

    return {
        lessons,
        createLesson,
        updateLesson,
        deleteLesson,
        recordCardResult,
        setLessons,
    };
}
