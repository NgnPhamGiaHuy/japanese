import { Klee_One, Noto_Sans_JP, Nunito } from "next/font/google";

/**
 * Self-hosted via next/font (no runtime requests to Google's font servers).
 * Pruned from the prior 6-font @import down to the 3 families actually
 * referenced by name anywhere in globals.css's --font-ui/--font-japanese
 * chains: Nunito (UI), Noto Sans JP (digital Japanese, default), Klee One
 * (handwriting Japanese, toggled via body.handwriting-font — see FontSyncer).
 * Dropped: Yoji Syuku (loaded but never referenced by any fallback chain —
 * dead weight), Yomogi + Noto Serif JP (redundant handwriting-chain
 * fallbacks; the system serif fonts already in that chain — Yu Mincho,
 * Hiragino Mincho Pro, MS PMincho — cover the same fallback need for free).
 */
export const nunito = Nunito({
    weight: "variable",
    subsets: ["latin"],
    display: "swap",
    variable: "--font-nunito",
});

export const notoSansJP = Noto_Sans_JP({
    weight: "variable",
    subsets: ["latin"],
    display: "swap",
    variable: "--font-noto-sans-jp",
});

export const kleeOne = Klee_One({
    weight: ["400", "600"],
    subsets: ["latin"],
    display: "swap",
    variable: "--font-klee-one",
});

/** Combined `className` for the root `<html>` element (and global-error.tsx's own). */
export const fontVariables = `${nunito.variable} ${notoSansJP.variable} ${kleeOne.variable}`;
