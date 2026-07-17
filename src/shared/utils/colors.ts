import type { ThemeColor } from "@/shared/components/ui/Button";

export const hexToThemeColor = (hex: string): ThemeColor => {
    switch (hex?.toLowerCase()) {
        case "#58cc02":
            return "green";
        case "#ff9600":
            return "orange";
        case "#ce82ff":
            return "purple";
        case "#ea2b2b":
            return "red";
        case "#ff66bb":
            return "pink";
        case "#00d1e0":
            return "teal";
        case "#afafaf":
            return "gray";
        default:
            return "blue";
    }
};

export type SemanticStatus = "danger" | "warning" | "success" | "info";

/**
 * One canonical hue per semantic role, sourced from the app's actual design
 * tokens — so Badge, ConfirmModal, Alert, and SettingsMenu stop each
 * independently re-picking their own red/orange/green/blue family (E17-T3,
 * C224). Previously: 3 visibly different reds (app `danger` token, Tailwind
 * `rose`, Tailwind `red`) and 3 different warning shade-families across
 * those 4 files.
 */
export const SEMANTIC_STATUS: Record<
    SemanticStatus,
    { theme: ThemeColor; bg: string; border: string; text: string }
> = {
    danger: { theme: "red", bg: "bg-danger-bg", border: "border-danger/20", text: "text-danger" },
    warning: {
        theme: "orange",
        bg: "bg-survival/10",
        border: "border-survival/20",
        text: "text-survival",
    },
    success: {
        theme: "green",
        bg: "bg-hiragana/10",
        border: "border-hiragana/20",
        text: "text-hiragana",
    },
    info: {
        theme: "blue",
        bg: "bg-katakana/10",
        border: "border-katakana/20",
        text: "text-katakana",
    },
};
