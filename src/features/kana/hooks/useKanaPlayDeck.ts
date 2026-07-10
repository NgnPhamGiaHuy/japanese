"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { speak } from "@/shared/audio";

import type { AlphabetMode, KanaChar } from "../types";

interface UseKanaPlayDeckParams {
    dataset: KanaChar[];
    alphabet: AlphabetMode;
    onVisit?: (char: KanaChar) => void;
    /**
     * Whether this mode speaks when the learner moves to the next character.
     * This is a mode concern only — the user's auto-play setting is enforced by the audio manager.
     */
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
        if (speakOnNavigate && nextChar) {
            speak(nextChar.char, { trigger: "auto", source: "kana-deck" });
        }
    };

    const toggleRandom = () => {
        setNavigation({
            ...normalizedNavigation,
            isRandom: !normalizedNavigation.isRandom,
        });
    };

    /** Learner tapped the speaker button. Never gated by the auto-play setting. */
    const playCurrent = () => {
        if (char) speak(char.char, { trigger: "user", source: "kana-deck" });
    };

    /** The app decided to speak (e.g. entering a listen-and-write mode). Respects auto-play. */
    const autoPlayCurrent = () => {
        if (char) speak(char.char, { trigger: "auto", source: "kana-deck" });
    };

    return {
        char,
        currentIndex: safeIndex,
        isRandom,
        next: () => navigate(1),
        prev: () => navigate(-1),
        playCurrent,
        autoPlayCurrent,
        toggleRandom,
    };
}
