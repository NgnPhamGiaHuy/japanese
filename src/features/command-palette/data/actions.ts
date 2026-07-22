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

/**
 * Route + icon only. The user-facing label and the fuzzy-search keywords live
 * in the CommandPalette message catalog keyed by `id`, and are resolved by
 * CommandPalette.tsx — a plain data module can't call useTranslations().
 */
export interface CommandAction {
    id: string;
    href: string;
    icon: LucideIcon;
}

/** Always-available navigation actions — mirrors BottomNav.tsx's route list. */
export const MAIN_ACTIONS: CommandAction[] = [
    { id: "home", href: "/", icon: Gamepad2 },
    { id: "kana", href: "/kana", icon: Languages },
    { id: "flashcard", href: "/flashcard", icon: Gamepad2 },
    { id: "notifications", href: "/notifications", icon: Bell },
    { id: "profile", href: "/profile", icon: User },
    { id: "settings", href: "/settings", icon: Settings },
];

/** Admin-only navigation actions — mirrors AdminSidebar.tsx's route list exactly. */
export const ADMIN_ACTIONS: CommandAction[] = [
    { id: "admin-dashboard", href: "/admin", icon: LayoutDashboard },
    { id: "admin-users", href: "/admin/users", icon: Users },
    { id: "admin-content", href: "/admin/content", icon: Database },
    { id: "admin-analytics", href: "/admin/analytics", icon: BarChart3 },
    { id: "admin-reports", href: "/admin/reports", icon: FileText },
];
