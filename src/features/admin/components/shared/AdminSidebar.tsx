"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Dialog } from "@base-ui/react/dialog";
import { clsx } from "clsx";
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
import { m } from "motion/react";

import { Button } from "@/shared/components/ui";

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
        <div className="border-katakana-strong from-katakana to-both flex h-10 w-10 -rotate-6 items-center justify-center rounded-xl border-b-4 bg-gradient-to-br text-2xl text-white shadow-sm ring-2 ring-white">
            あ
        </div>
        <span className="text-text text-lg font-black tracking-tighter">
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
                                : "text-muted hover:text-text hover:bg-gray-50",
                        )}
                    >
                        <Icon
                            size={20}
                            className={
                                isActive ? "text-katakana" : "group-hover:text-text text-gray-400"
                            }
                        />
                        {item.label}
                        {isActive && (
                            <m.div
                                layoutId="active-sidebar"
                                className="bg-katakana absolute -left-3 h-8 w-1.5 rounded-r-full"
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
            <p className="text-muted text-xs font-black tracking-widest uppercase">Superadmin</p>
            <p className="text-text mt-1 truncate text-xs font-bold">Console Managed</p>
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
            <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
                <Dialog.Portal>
                    {/* Backdrop */}
                    <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 lg:hidden" />

                    {/* Drawer panel */}
                    <Dialog.Popup
                        aria-modal="true"
                        aria-label="Navigation"
                        className="fixed top-0 left-0 z-50 flex h-full w-72 flex-col border-r-2 border-gray-100 bg-white transition-transform duration-200 ease-out data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full lg:hidden"
                    >
                        <div className="flex h-14 items-center justify-between px-4">
                            <Logo />
                            <Dialog.Close
                                render={
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Close navigation"
                                        className="rounded-xl"
                                        icon={X}
                                        iconSize={20}
                                    />
                                }
                            />
                        </div>
                        <NavLinks onNavigate={() => setDrawerOpen(false)} />
                        <Footer />
                    </Dialog.Popup>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
};

export default AdminSidebar;
