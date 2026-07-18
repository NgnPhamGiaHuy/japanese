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
import { useTranslations } from "next-intl";

import Button from "./Button";

/** Attributes for rendering a NotFoundScreen. */
interface NotFoundScreenProps {
    /** Primary heading text (defaults to a localized "Not Found"). */
    title?: string;
    /** Optional secondary descriptive text explaining what is missing. */
    description?: string;
    /** Action button text (defaults to a localized "Go Back"). */
    buttonText?: string;
    /** Triggered when the action button is clicked. */
    onBack: () => void;
}

const NotFoundScreen = ({ title, description, buttonText, onBack }: NotFoundScreenProps) => {
    const t = useTranslations("Common");

    return (
        <div className="bg-bg fixed inset-0 flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-text mb-4 text-2xl font-black">{title ?? t("notFound")}</h1>
            {description && <p className="text-muted mb-6 font-bold">{description}</p>}
            <Button
                variant="plain"
                size="auto"
                onClick={onBack}
                className="text-katakana font-bold shadow-none hover:shadow-none active:translate-y-0"
            >
                {buttonText ?? t("goBack")}
            </Button>
        </div>
    );
};

export default NotFoundScreen;
