import {
    BarChart3,
    Bell,
    Database,
    FileText,
    Gamepad2,
    Languages,
    LayoutDashboard,
    Settings,
    User,
    Users,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export interface CommandAction {
    id: string;
    label: string;
    href: string;
    icon: LucideIcon;
    keywords?: string[];
}

/** Always-available navigation actions — mirrors BottomNav.tsx's route list. */
export const MAIN_ACTIONS: CommandAction[] = [
    { id: "home", label: "Home", href: "/", icon: Gamepad2, keywords: ["lessons", "start"] },
    {
        id: "kana",
        label: "Kana Chart",
        href: "/kana",
        icon: Languages,
        keywords: ["hiragana", "katakana", "alphabet"],
    },
    {
        id: "flashcard",
        label: "Decks",
        href: "/flashcard",
        icon: Gamepad2,
        keywords: ["flashcards", "study", "cards"],
    },
    {
        id: "notifications",
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
        keywords: ["alerts", "inbox"],
    },
    { id: "profile", label: "Profile", href: "/profile", icon: User, keywords: ["account", "me"] },
    {
        id: "settings",
        label: "Settings",
        href: "/settings",
        icon: Settings,
        keywords: ["preferences", "config"],
    },
];

/** Admin-only navigation actions — mirrors AdminSidebar.tsx's route list exactly. */
export const ADMIN_ACTIONS: CommandAction[] = [
    {
        id: "admin-dashboard",
        label: "Admin Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
    },
    { id: "admin-users", label: "Admin · Users", href: "/admin/users", icon: Users },
    {
        id: "admin-content",
        label: "Admin · Content",
        href: "/admin/content",
        icon: Database,
    },
    {
        id: "admin-analytics",
        label: "Admin · Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
        keywords: ["reports", "stats", "charts"],
    },
    {
        id: "admin-reports",
        label: "Admin · Reports",
        href: "/admin/reports",
        icon: FileText,
        keywords: ["logs", "flags"],
    },
    {
        id: "admin-settings",
        label: "Admin · Settings",
        href: "/admin/settings",
        icon: Settings,
    },
];
