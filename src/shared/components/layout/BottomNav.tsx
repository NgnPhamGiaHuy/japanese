"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Gamepad2, Settings, Trophy } from "lucide-react";

const NAV_ICON_SIZE = 26;
const NAV_ICON_STROKE_ACTIVE = 2.5;
const NAV_ICON_STROKE_IDLE = 2;

interface NavRoute {
    href: string;
    label: string;
    icon: React.ReactNode;
    activeIcon: React.ReactNode;
    activeColor: string;
}

const ROUTES: NavRoute[] = [
    {
        href: "/",
        label: "Home",
        icon: (
            <BookOpen size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE_IDLE} />
        ),
        activeIcon: (
            <BookOpen
                size={NAV_ICON_SIZE}
                strokeWidth={NAV_ICON_STROKE_ACTIVE}
            />
        ),
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
        icon: (
            <Gamepad2 size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE_IDLE} />
        ),
        activeIcon: (
            <Gamepad2
                size={NAV_ICON_SIZE}
                strokeWidth={NAV_ICON_STROKE_ACTIVE}
            />
        ),
        activeColor: "text-[#ce82ff]",
    },
    {
        href: "/profile",
        label: "Profile",
        icon: (
            <Trophy size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE_IDLE} />
        ),
        activeIcon: (
            <Trophy size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE_ACTIVE} />
        ),
        activeColor: "text-[#ff9600]",
    },
    {
        href: "/settings",
        label: "Settings",
        icon: (
            <Settings size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE_IDLE} />
        ),
        activeIcon: (
            <Settings
                size={NAV_ICON_SIZE}
                strokeWidth={NAV_ICON_STROKE_ACTIVE}
            />
        ),
        activeColor: "text-[#afafaf]",
    },
];

export default function BottomNav() {
    const pathname = usePathname();

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);

    return (
        <nav
            aria-label="Main navigation"
            className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 pb-safe pt-2 px-2 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40"
        >
            {ROUTES.map((route) => {
                const active = isActive(route.href);
                return (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={`flex flex-col items-center justify-center gap-1 min-w-[52px] py-1 rounded-xl transition-colors duration-150 ${
                            active
                                ? route.activeColor
                                : "text-[#afafaf] hover:text-[#3c3c3c]"
                        }`}
                        aria-current={active ? "page" : undefined}
                    >
                        {active ? route.activeIcon : route.icon}
                        <span
                            className={`text-[9px] font-black uppercase tracking-wider ${active ? "" : ""}`}
                        >
                            {route.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
