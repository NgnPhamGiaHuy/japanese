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
