export interface FlashCard {
    id: string;
    lessonId: string;
    kanji: string;
    furigana: string;
    meaning: string;
    example: string;

    // Media
    imageUrl?: string;
    imagePath?: string;

    // SRS Fields
    easeFactor: number;
    interval: number;
    repetitions: number;
    nextReviewAt: number;

    // AI-enriched fields (optional — fully backward-compatible)
    distractors?: string[];
    hint?: string;
    usageNote?: string;
    difficulty?: 1 | 2 | 3;
}

export interface Lesson {
    id: string;
    userId?: string;
    title: string;
    description: string;
    tags: string[];
    createdAt: number;
    cardCount: number;
    roles?: Record<string, "owner" | "editor" | "commenter" | "viewer">;
    collaborators?: string[];
    allowLinkAccess?: boolean;
    publicRole?: "viewer" | "commenter" | "editor";

    isPublic?: boolean;
    shareId?: string;

    themeColor?: string;
    sourceLessonId?: string;
    sourceUserId?: string;
}

export interface StudyStats {
    correct: number;
    incorrect: number;
    mistakeCardIds: string[];
}

export type StudyMode = "learn" | "practice" | "mistake-review";
