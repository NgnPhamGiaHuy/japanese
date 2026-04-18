"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Bell, BookOpen, Gamepad2, Shield } from "lucide-react";

import { useAdminRole } from "@/features/admin/context/AdminContext";
import { useNotifications } from "@/features/notifications";
import { UserAvatar } from "@/shared/components/ui";
import { useAppStore } from "@/store";

const NAV_ICON_SIZE = 26;
const NAV_ICON_STROKE_ACTIVE = 2.5;
const NAV_ICON_STROKE_IDLE = 2;

interface NavRoute {
    href: string;
    label: string;
    icon: React.ReactNode;
    activeIcon: React.ReactNode;
    activeColor: string;
    badge?: number;
}

function buildRoutes(
    unreadCount: number,
    userPhoto?: string | null,
    isAdmin?: boolean,
): NavRoute[] {
    const routes: NavRoute[] = [
        {
            href: "/",
            label: "Home",
            icon: <BookOpen size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE_IDLE} />,
            activeIcon: <BookOpen size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE_ACTIVE} />,
            activeColor: "text-[#1cb0f6]",
        },
        {
            href: "/kana",
            label: "Kana",
            icon: (
                <span
                    className="block leading-none"
                    style={{ fontSize: NAV_ICON_SIZE, lineHeight: 1 }}
                >
                    あ
                </span>
            ),
            activeIcon: (
                <span
                    className="block leading-none font-black"
                    style={{ fontSize: NAV_ICON_SIZE, lineHeight: 1 }}
                >
                    あ
                </span>
            ),
            activeColor: "text-[#58cc02]",
        },
        {
            href: "/flashcard",
            label: "Decks",
            icon: <Gamepad2 size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE_IDLE} />,
            activeIcon: <Gamepad2 size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE_ACTIVE} />,
            activeColor: "text-[#ce82ff]",
        },
        {
            href: "/notifications",
            label: "Alerts",
            icon: <Bell size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE_IDLE} />,
            activeIcon: <Bell size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE_ACTIVE} />,
            activeColor: "text-[#1cb0f6]",
            badge: unreadCount,
        },
    ];

    if (isAdmin) {
        routes.push({
            href: "/admin",
            label: "Admin",
            icon: <Shield size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE_IDLE} />,
            activeIcon: <Shield size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE_ACTIVE} />,
            activeColor: "text-[#ea2b2b]",
        });
    }

    routes.push({
        href: "/profile",
        label: "Profile",
        icon: <UserAvatar src={userPhoto} active={false} activeColor="text-[#ff9600]" />,
        activeIcon: <UserAvatar src={userPhoto} active={true} activeColor="text-[#ff9600]" />,
        activeColor: "text-[#ff9600]",
    });

    return routes;
}

export const BottomNav = () => {
    const pathname = usePathname();
    const { user } = useAppStore();
    const { unreadCount } = useNotifications();
    const { role } = useAdminRole();
    const ROUTES = buildRoutes(unreadCount, user?.photoURL, !!role);

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        if (href === "/profile")
            return pathname.startsWith("/profile") || pathname.startsWith("/settings");
        return pathname.startsWith(href);
    };

    return (
        <nav
            aria-label="Main navigation"
            className="pb-safe fixed right-0 bottom-0 left-0 z-40 flex items-center justify-around border-t-2 border-gray-200 bg-white px-2 pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
        >
            {ROUTES.map((route) => {
                const active = isActive(route.href);
                return (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={`relative flex min-w-[52px] flex-col items-center justify-center gap-1 rounded-xl py-1 transition-colors duration-150 ${
                            active ? route.activeColor : "text-[#afafaf] hover:text-[#3c3c3c]"
                        }`}
                        aria-current={active ? "page" : undefined}
                    >
                        {/* Premium Glow for Active Admin Tab */}
                        {active && route.label === "Admin" && (
                            <div className="absolute inset-0 z-[-1] animate-pulse rounded-full bg-[#ea2b2b]/10 blur-md" />
                        )}

                        <div className="relative">
                            {active ? route.activeIcon : route.icon}

                            {/* Unread badge for Alerts */}
                            {route.badge != null && route.badge > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ea2b2b] px-1 text-[9px] font-black text-white">
                                    {route.badge > 99 ? "99+" : route.badge}
                                </span>
                            )}

                            {/* Admin Indicator Badge for Profile */}
                            {route.label === "Profile" && role && (
                                <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-[#ea2b2b] shadow-sm">
                                    <Shield size={6} className="text-white" fill="currentColor" />
                                </div>
                            )}
                        </div>
                        <span className="text-[9px] font-black tracking-wider uppercase">
                            {route.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
};

export default BottomNav;
