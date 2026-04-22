/**
 * Full-screen error screen for missing resources.
 *
 * @remarks
 * Reusable 404/not found screen with customizable messaging.
 * Used when resources like lessons, decks, or user profiles are not found.
 *
 * @example
 * <NotFoundScreen
 *   title="Lesson Not Found"
 *   description="The lesson you are looking for does not exist or has been removed."
 *   onBack={() => router.back()}
 * />
 */
import Button from "./Button";

/** Attributes for rendering a NotFoundScreen. */
interface NotFoundScreenProps {
    /** Primary heading text (default: "Not Found"). */
    title?: string;
    /** Optional secondary descriptive text explaining what is missing. */
    description?: string;
    /** Text to display on the action button (default: "Go Back"). */
    buttonText?: string;
    /** Triggered when the action button is clicked. */
    onBack: () => void;
}

const NotFoundScreen = ({
    title = "Not Found",
    description,
    buttonText = "Go Back",
    onBack,
}: NotFoundScreenProps) => {
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
};

export default NotFoundScreen;
