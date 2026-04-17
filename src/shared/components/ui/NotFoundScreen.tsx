/**
 * NotFoundScreen Component
 *
 * @remarks
 * Reusable 404/not found screen with customizable message.
 * Used when resources (lessons, decks, etc.) are not found.
 */
/**
 * NotFoundScreen Component
 *
 * @remarks
 * Reusable 404/not found screen with customizable message.
 * Used when resources (lessons, decks, etc.) are not found.
 */
import Button from "./Button";

interface NotFoundScreenProps {
    /** Title text (default: "Not Found") */
    title?: string;
    /** Optional description text */
    description?: string;
    /** Button text (default: "Go Back") */
    buttonText?: string;
    /** Button click handler */
    onBack: () => void;
}

/**
 * Full-screen centered not found message
 */
export function NotFoundScreen({
    title = "Not Found",
    description,
    buttonText = "Go Back",
    onBack,
}: NotFoundScreenProps) {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
            <h1 className="mb-4 text-2xl font-black text-[#3c3c3c]">{title}</h1>
            {description && <p className="mb-6 font-bold text-[#afafaf]">{description}</p>}
            <Button
                variant="ghost"
                onClick={onBack}
                className="font-bold! text-[#1cb0f6]! shadow-none hover:shadow-none active:translate-y-0"
            >
                {buttonText}
            </Button>
        </div>
    );
}
