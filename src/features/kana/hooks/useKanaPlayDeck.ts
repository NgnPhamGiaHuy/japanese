"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { playAudio } from "@/shared/utils";

import type { AlphabetMode, KanaChar } from "../types";

interface UseKanaPlayDeckParams {
    dataset: KanaChar[];
    alphabet: AlphabetMode;
    onVisit?: (char: KanaChar) => void;
    speakOnNavigate?: boolean;
}

export function useKanaPlayDeck({
    dataset,
    alphabet,
    onVisit,
    speakOnNavigate = true,
}: UseKanaPlayDeckParams) {
    const [navigation, setNavigation] = useState({
        alphabet,
        currentIndex: 0,
        isRandom: false,
    });
    const onVisitRef = useRef(onVisit);

    useLayoutEffect(() => {
        onVisitRef.current = onVisit;
    });

    const currentIndex = navigation.alphabet === alphabet ? navigation.currentIndex : 0;
    const safeIndex = dataset.length > 0 ? Math.min(currentIndex, dataset.length - 1) : 0;
    const char = dataset[safeIndex] ?? null;
    const isRandom = navigation.alphabet === alphabet ? navigation.isRandom : false;

    useEffect(() => {
        if (char) onVisitRef.current?.(char);
    }, [char]);

    const normalizedNavigation =
        navigation.alphabet === alphabet
            ? navigation
            : { ...navigation, alphabet, currentIndex: 0 };

    const pickRandomIndex = (fromIndex: number) => {
        if (dataset.length <= 1) return 0;
        let nextIndex = Math.floor(Math.random() * dataset.length);
        while (nextIndex === fromIndex) nextIndex = Math.floor(Math.random() * dataset.length);
        return nextIndex;
    };

    const navigate = (direction: 1 | -1) => {
        if (dataset.length === 0) return;

        const fromIndex = Math.min(normalizedNavigation.currentIndex, dataset.length - 1);
        const nextIndex = normalizedNavigation.isRandom
            ? pickRandomIndex(fromIndex)
            : (fromIndex + direction + dataset.length) % dataset.length;
        const nextChar = dataset[nextIndex];

        setNavigation({ ...normalizedNavigation, currentIndex: nextIndex });
        if (speakOnNavigate && nextChar) playAudio(nextChar.char);
    };

    const toggleRandom = () => {
        setNavigation({
            ...normalizedNavigation,
            isRandom: !normalizedNavigation.isRandom,
        });
    };

    const playCurrent = () => {
        if (char) playAudio(char.char);
    };

    return {
        char,
        currentIndex: safeIndex,
        isRandom,
        next: () => navigate(1),
        prev: () => navigate(-1),
        playCurrent,
        toggleRandom,
    };
}
