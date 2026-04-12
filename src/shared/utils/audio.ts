"use client";

if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () =>
        window.speechSynthesis.getVoices();
}

/** Plays a Japanese text string using the Web Speech API */
export function playAudio(text: string): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.75;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const jpVoices = voices.filter(
        (v) => v.lang === "ja-JP" || v.lang === "ja_JP" || v.lang.includes("ja")
    );

    if (jpVoices.length > 0) {
        utterance.voice =
            jpVoices.find(
                (v) =>
                    v.name.includes("Google 日本語") ||
                    v.name.includes("Google Japanese")
            ) ??
            jpVoices.find(
                (v) => v.name.includes("Kyoko") || v.name.includes("Otoya")
            ) ??
            jpVoices.find(
                (v) => v.name.includes("Ayumi") || v.name.includes("Haruka")
            ) ??
            jpVoices[0];
    }

    utterance.onend = () => {};
    utterance.onerror = () => {};

    window.speechSynthesis.speak(utterance);
}
