/**
 * McChoiceGrid — Four-option multiple-choice answer grid, shared by
 * FlashcardPractice (Recognition Stage) and FlashcardMistakeReview
 * (Recognition Mode), which previously each hand-rolled an identical
 * choices-mapping/color-branching block.
 */
"use client";

import { Button } from "@/shared/components/ui";

interface McChoiceGridProps {
    /** The four answer options to render. */
    choices: string[];
    /** Compared against each choice to determine the "correct" highlight. */
    correctAnswer: string;
    /** Currently-selected choice, or null before a pick is made. */
    selected: string | null;
    onSelect: (choice: string) => void;
    /**
     * Practice colors choice text via Button's `color` prop; MistakeReview wraps the
     * text in an inner span with an inline `color` instead. These aren't equivalent —
     * Button's custom-color branch for a non-theme color like "white" also overwrites
     * `backgroundColor`/`borderBottomColor` on `variant="primary"`, which is why
     * Practice's correct/wrong tiles don't actually show their intended green/red fill
     * today. Kept per-caller so this refactor doesn't change either screen's rendering.
     */
    textColorMode: "buttonColorProp" | "innerSpan";
    /** Extra classes appended to each tile (Practice adds `!leading-snug`). */
    tileClassName?: string;
}

const McChoiceGrid = ({
    choices,
    correctAnswer,
    selected,
    onSelect,
    textColorMode,
    tileClassName = "",
}: McChoiceGridProps) => {
    // Correctness is signalled only by tile colour, which a screen-reader user cannot perceive.
    const announcement =
        selected === null
            ? ""
            : selected === correctAnswer
              ? `Correct. The answer is ${correctAnswer}.`
              : `Incorrect. The answer is ${correctAnswer}.`;

    return (
        <div className="grid grid-cols-2 gap-3">
            <span role="status" aria-live="polite" className="sr-only">
                {announcement}
            </span>
            {choices.map((choice) => {
                const isSelected = selected === choice;
                const isCorrect = choice === correctAnswer;
                let style: React.CSSProperties = {
                    backgroundColor: "white",
                    borderBottomColor: "var(--color-border)",
                };
                let variant: "primary" | "secondary" = "secondary";
                if (selected !== null) {
                    if (isCorrect) {
                        variant = "primary";
                        style = {
                            backgroundColor: "var(--color-hiragana)",
                            borderBottomColor: "var(--color-hiragana-strong)",
                        };
                    } else if (isSelected) {
                        variant = "primary";
                        style = {
                            backgroundColor: "#ff4b4b",
                            borderBottomColor: "var(--color-danger)",
                        };
                    } else {
                        style = {
                            backgroundColor: "white",
                            borderBottomColor: "var(--color-border)",
                            opacity: 0.5,
                        };
                    }
                }

                const textColor =
                    selected !== null && (isCorrect || isSelected)
                        ? "white"
                        : selected !== null
                          ? "#afafaf"
                          : "#3c3c3c";

                return (
                    <Button
                        key={choice}
                        onClick={() => onSelect(choice)}
                        disabled={selected !== null}
                        variant={variant}
                        className={`!px-4 !py-4 !text-left !text-sm ${tileClassName ? `${tileClassName} ` : ""}!font-bold shadow-none transition-all hover:shadow-none ${selected !== null && !isCorrect && !isSelected ? "opacity-50" : ""}`}
                        style={style}
                        color={textColorMode === "buttonColorProp" ? textColor : undefined}
                    >
                        {textColorMode === "innerSpan" ? (
                            <span style={{ color: textColor }}>{choice}</span>
                        ) : (
                            choice
                        )}
                    </Button>
                );
            })}
        </div>
    );
};

export default McChoiceGrid;
