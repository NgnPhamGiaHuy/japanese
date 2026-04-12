export interface FlashCard {
    id: string;
    kanji: string;
    furigana: string;
    meaning: string;
    example: string;
    correctCount: number;
    wrongCount: number;
}

export interface Lesson {
    id: string;
    title: string;
    description: string;
    tags: string[];
    createdAt: number;
    cards: FlashCard[];
}

export interface StudyStats {
    correct: number;
    incorrect: number;
}
