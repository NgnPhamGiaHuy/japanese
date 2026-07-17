/**
 * @file analytics-content
 * Content-category distribution for the aggregate analytics chart — split
 * out of analytics.service.ts's getAdminAnalytics (E11-T3).
 *
 * NOTE: getContentBreakdown (analytics-drilldowns.ts) implements its OWN,
 * differently-structured per-lesson categorization (independent isVocab/
 * isGrammar/isKanji booleans that CAN all be true for the same lesson) —
 * it is not the same logic as this file's layered/short-circuiting
 * categorization, despite looking similar. Deliberately NOT unified: a
 * concrete trace (a lesson with categories:["vocab"], type:"grammar") shows
 * this file's version counts it once (Vocabulary only), while
 * getContentBreakdown's would match both the Vocabulary and Grammar
 * drilldowns. That divergence may itself be worth fixing, but doing so
 * silently inside a line-count split would be an unverified behavior
 * change, not a pure split — left as-is and flagged here for visibility.
 */
import type { RolePoint } from "../types";

interface CategoryCounts {
    Vocabulary: number;
    Grammar: number;
    Kanji: number;
    Other: number;
    Uncategorized: number;
}

function categorizeLessonsForChart(lessonsSample: Record<string, unknown>[]): CategoryCounts {
    const catCounts: CategoryCounts = {
        Vocabulary: 0,
        Grammar: 0,
        Kanji: 0,
        Other: 0,
        Uncategorized: 0,
    };
    const uncategorizedSamples: string[] = [];

    lessonsSample.forEach((lesson) => {
        // Multi-Categorization Engine
        const cats = ((lesson.categories as string[]) || []).map((c: string) => c.toLowerCase());
        const explicitType = (lesson.type as string | undefined)?.toLowerCase();
        let matchedPrimary = false;

        // 1. Process explicit categories
        if (cats.length > 0) {
            if (cats.some((c: string) => c.includes("vocab") || c.includes("tango"))) {
                catCounts.Vocabulary++;
                matchedPrimary = true;
            }
            if (cats.some((c: string) => c.includes("grammar") || c.includes("bunpou"))) {
                catCounts.Grammar++;
                matchedPrimary = true;
            }
            if (cats.some((c: string) => c.includes("kanji"))) {
                catCounts.Kanji++;
                matchedPrimary = true;
            }

            if (!matchedPrimary) {
                catCounts.Other++;
                return; // Categorized as Other, skip keywords
            }

            // If we matched primary ones, we don't count it as other, but we also don't return early
            // because we might want to check the 'type' field too (legacy compat)
        }

        // 2. Process legacy 'type' field (if not already matched by categories)
        if (!matchedPrimary && explicitType) {
            if (explicitType.includes("vocab") || explicitType.includes("tango")) {
                catCounts.Vocabulary++;
                matchedPrimary = true;
            } else if (explicitType.includes("grammar") || explicitType.includes("bunpou")) {
                catCounts.Grammar++;
                matchedPrimary = true;
            } else if (explicitType.includes("kanji")) {
                catCounts.Kanji++;
                matchedPrimary = true;
            } else {
                catCounts.Other++;
                return;
            }
        }

        if (matchedPrimary) return;

        // 3. Final Fallback: Keyword discovery
        const text = `${lesson.title || ""} ${lesson.description || ""}`.toLowerCase();
        if (text.includes("grammar") || text.includes("bunpou") || text.includes("文法")) {
            catCounts.Grammar++;
        } else if (text.includes("kanji") || text.includes("漢字")) {
            catCounts.Kanji++;
        } else if (
            text.includes("vocabulary") ||
            text.includes("vocab") ||
            text.includes("tango") ||
            text.includes("deck") ||
            text.includes("words") ||
            text.includes("単語")
        ) {
            catCounts.Vocabulary++;
        } else {
            catCounts.Uncategorized++;
            if (uncategorizedSamples.length < 5) {
                uncategorizedSamples.push((lesson.title as string) || "Untitled");
            }
        }
    });

    // Log categorization issues for debugging
    if (catCounts.Uncategorized > lessonsSample.length * 0.3) {
        console.warn(
            `[Analytics] High uncategorized content: ${catCounts.Uncategorized}/${lessonsSample.length} lessons have no metadata.`,
        );
        console.warn(`Sample uncategorized titles:`, uncategorizedSamples);
    }

    return catCounts;
}

/**
 * Builds the content-distribution chart series: sampled category ratios
 * (from up to 200 lessons) scaled up to the platform's true total card
 * count, so the chart reflects real scale without scanning every lesson.
 */
export function buildContentDistribution(
    lessonsSample: Record<string, unknown>[],
    totalFlashcards: number,
): RolePoint[] {
    const catCounts = categorizeLessonsForChart(lessonsSample);
    const totalSample = lessonsSample.length || 1;

    const contentDistribution: RolePoint[] = [
        {
            name: "Vocabulary",
            value: Math.round((catCounts.Vocabulary / totalSample) * totalFlashcards),
        },
        { name: "Grammar", value: Math.round((catCounts.Grammar / totalSample) * totalFlashcards) },
        { name: "Kanji", value: Math.round((catCounts.Kanji / totalSample) * totalFlashcards) },
    ];

    if (catCounts.Other > 0) {
        contentDistribution.push({
            name: "Other",
            value: Math.round((catCounts.Other / totalSample) * totalFlashcards),
        });
    }

    if (catCounts.Uncategorized > 0) {
        contentDistribution.push({
            name: "Uncategorized",
            value: Math.round((catCounts.Uncategorized / totalSample) * totalFlashcards),
        });
    }

    return contentDistribution;
}
