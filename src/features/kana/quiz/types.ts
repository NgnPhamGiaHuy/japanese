/**
 * Type definitions for Kana Quiz feature
 */

export type QuizMode = "choice" | "type" | "smart";
export type QuizPhase = "setup" | "playing" | "done";

export interface QuizSetupProps {
    alphabet: "hiragana" | "katakana" | "both";
    themeColor: {
        bg: string;
        border: string;
    };
    onStartQuiz: (mode: QuizMode) => void;
}

export interface QuizResultsProps {
    score: number;
    targetScore: number;
    alphabet: "hiragana" | "katakana" | "both";
    themeColor: {
        bg: string;
        border: string;
        text: string;
    };
    onPlayAgain: () => void;
    onChangeMode: () => void;
}
