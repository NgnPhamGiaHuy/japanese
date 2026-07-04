"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
    BarChart3,
    Database,
    FileText,
    LayoutDashboard,
    Menu,
    Settings,
    Users,
    X,
} from "lucide-react";

import { Button } from "@/shared/components/ui";
import { useDialogA11y } from "@/shared/hooks";

const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Content", href: "/admin/content", icon: Database },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Reports", href: "/admin/reports", icon: FileText },
    { label: "Settings", href: "/admin/settings", icon: Settings },
];

const Logo = () => (
    <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 -rotate-6 items-center justify-center rounded-xl border-b-4 border-katakana-strong bg-gradient-to-br from-katakana to-both text-2xl text-white shadow-sm ring-2 ring-white">
            あ
        </div>
        <span className="text-lg font-black tracking-tighter text-text">
            ADMIN <span className="text-katakana">PRO</span>
        </span>
    </div>
);

const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => {
    const pathname = usePathname();
    return (
        <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={isActive ? "page" : undefined}
                        className={clsx(
                            "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition-all",
                            isActive
                                ? "bg-katakana/10 text-katakana"
                                : "text-muted hover:bg-gray-50 hover:text-text",
                        )}
                    >
                        <Icon
                            size={20}
                            className={
                                isActive
                                    ? "text-katakana"
                                    : "text-gray-400 group-hover:text-text"
                            }
                        />
                        {item.label}
                        {isActive && (
                            <motion.div
                                layoutId="active-sidebar"
                                className="absolute -left-3 h-8 w-1.5 rounded-r-full bg-katakana"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                            />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
};

const Footer = () => (
    <div className="p-4">
        <div className="rounded-2xl border-2 border-dashed border-gray-100 p-4">
            <p className="text-xs font-black tracking-widest text-muted uppercase">
                Superadmin
            </p>
            <p className="mt-1 truncate text-xs font-bold text-text">Console Managed</p>
        </div>
    </div>
);

/**
 * Admin Navigation Sidebar — desktop fixed rail + mobile drawer.
 *
 * @remarks On lg+ screens renders a fixed left sidebar.
 * On smaller screens renders a top bar with a hamburger that opens a full-height drawer.
 */
const AdminSidebar = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const drawerRef = useDialogA11y<HTMLDivElement>(drawerOpen, () => setDrawerOpen(false));

    return (
        <>
            {/* ── Desktop sidebar ── */}
            <aside className="fixed top-0 left-0 hidden h-full w-64 flex-col border-r-2 border-gray-100 bg-white/80 backdrop-blur-xl lg:flex">
                <div className="flex h-20 items-center px-6">
                    <Logo />
                </div>
                <NavLinks />
                <Footer />
            </aside>

            {/* ── Mobile top bar ── */}
            <header className="fixed top-0 right-0 left-0 z-40 flex h-14 items-center justify-between border-b-2 border-gray-100 bg-white/90 px-4 backdrop-blur-xl lg:hidden">
                <Logo />
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDrawerOpen(true)}
                    aria-label="Open navigation"
                    className="rounded-xl"
                    icon={Menu}
                    iconSize={20}
                />
            </header>

            {/* ── Mobile drawer ── */}
            <AnimatePresence>
                {drawerOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
                            onClick={() => setDrawerOpen(false)}
                        />
                        {/* Drawer panel */}
                        <motion.div
                            ref={drawerRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Navigation"
                            key="drawer"
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed top-0 left-0 z-50 flex h-full w-72 flex-col border-r-2 border-gray-100 bg-white lg:hidden"
                        >
                            <div className="flex h-14 items-center justify-between px-4">
                                <Logo />
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => setDrawerOpen(false)}
                                    aria-label="Close navigation"
                                    className="rounded-xl"
                                    icon={X}
                                    iconSize={20}
                                />
                            </div>
                            <NavLinks onNavigate={() => setDrawerOpen(false)} />
                            <Footer />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default AdminSidebar;
