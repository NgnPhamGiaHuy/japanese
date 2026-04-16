/**
 * Orchestrates question generation for game sessions.
 * 
 * @remarks
 * Coordinates card selection, question type determination, and distractor generation
 * to produce complete Question objects ready for presentation. Maintains recency
 * tracking to prevent immediate repetition.
 */

import { shuffleArray } from "@/shared/utils";
import { buildQuestion } from "@/features/flashcard/utils";
import { CardMemoryManager } from "../memory/CardMemoryManager";
import { CardSelector } from "../memory/CardSelector";
import { DistractorBuilder } from "./DistractorBuilder";
import { QuestionTypeSelector } from "./QuestionTypeSelector";

import type { FlashCard } from "@/features/flashcard/types";
import type { ModeStrategy, Question } from "../types";

export class QuestionEngine {
    private readonly cardMemory: CardMemoryManager;
    private readonly cardSelector: CardSelector;
    private readonly distractorBuilder: DistractorBuilder;
    private readonly typeSelector: QuestionTypeSelector;
    private readonly strategy: ModeStrategy;
    private readonly cards: FlashCard[];
    private recentCardIds: string[] = [];

    constructor(params: { cards: FlashCard[]; strategy: ModeStrategy }) {
        this.cards = params.cards;
        this.strategy = params.strategy;
        this.cardMemory = new CardMemoryManager(params.cards);
        this.cardSelector = new CardSelector(this.cardMemory);
        this.distractorBuilder = new DistractorBuilder();
        this.typeSelector = new QuestionTypeSelector();
    }

    /**
     * Generates a complete question for the specified difficulty level.
     * 
     * @remarks
     * Pipeline:
     * 1. Select card using weighted probability (CardSelector)
     * 2. Choose question type based on difficulty (QuestionTypeSelector)
     * 3. Build prompt and answer from card data
     * 4. Generate smart distractors (DistractorBuilder)
     * 5. Shuffle options and package as Question object
     * 
     * Tracks recently shown cards to prevent immediate repetition.
     */
    generateQuestion(level: number): Question {
        const config = this.strategy.getQuestionConfig(level);

        const card = this.cardSelector.selectNext({
            cards: this.cards,
            recentIds: this.recentCardIds,
            level,
        });

        // Null only when card pool is empty — useGameEngine guards against this,
        // but we fail fast here rather than crashing deeper in the pipeline.
        if (!card) {
            throw new Error("[QuestionEngine] Cannot generate question: card pool is empty.");
        }

        this.recentCardIds = [...this.recentCardIds, card.id].slice(-10);

        const questionType = this.typeSelector.choose(card, {
            allowedTypes: config.allowedQuestionTypes,
            preferPrimary: config.preferPrimaryToMeaning,
            difficulty: level,
        });

        const { prompt, answer } = buildQuestion(card, questionType);

        const distractors = config.useSmartDistractors
            ? this.distractorBuilder.buildSmart({
                  allCards: this.cards,
                  currentCard: card,
                  answer,
                  questionType,
                  memory: this.cardMemory.getState() as Record<string, any>,
              })
            : this.distractorBuilder.buildRandom(
                  this.cards,
                  card,
                  answer,
                  config.distractorCount,
              );

        const options = shuffleArray([answer, ...distractors]);

        return {
            id: `q-${card.id}-${Date.now()}`,
            cardId: card.id,
            type: questionType,
            prompt,
            answer,
            options,
            metadata: {
                difficulty: level,
                timeLimit: this.strategy.getTimeLimit(level, 0),
                showHint: level <= 1,
            },
        };
    }

    /**
     * Records answer outcome in memory system for adaptive learning.
     */
    recordAnswer(params: {
        cardId: string;
        questionIndex: number;
        correct: boolean;
        responseMs: number;
        mistakenChoice?: string | null;
    }): void {
        this.cardMemory.recordOutcome(params);
    }

    reset(): void {
        this.recentCardIds = [];
        this.cardMemory.reset();
    }

    getMemoryState(): Record<string, any> {
        return this.cardMemory.getState() as Record<string, any>;
    }
}
