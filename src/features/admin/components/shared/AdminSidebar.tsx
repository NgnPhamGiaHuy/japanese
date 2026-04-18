"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import { BarChart3, Database, FileText, LayoutDashboard, Settings, Users } from "lucide-react";

const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Content", href: "/admin/content", icon: Database },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Reports", href: "/admin/reports", icon: FileText },
    { label: "Settings", href: "/admin/settings", icon: Settings },
];

/**
 * Secondary Admin Navigation Sidebar.
 *
 * @remarks provides the primary navigation rail for the admin sub-module.
 * Uses motion-driven active states and glassmorphism for a premium feel.
 */
const AdminSidebar = () => {
    const pathname = usePathname();

    return (
        <aside className="fixed top-0 left-0 hidden h-full w-64 flex-col border-r-2 border-gray-100 bg-white/80 backdrop-blur-xl lg:flex">
            <div className="flex h-20 items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 -rotate-6 items-center justify-center rounded-xl border-b-4 border-[#1899d6] bg-gradient-to-br from-[#1cb0f6] to-[#ce82ff] text-2xl text-white shadow-sm ring-2 ring-white">
                        あ
                    </div>
                    <span className="text-lg font-black tracking-tighter text-[#3c3c3c]">
                        ADMIN <span className="text-[#1cb0f6]">PRO</span>
                    </span>
                </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition-all",
                                isActive
                                    ? "bg-[#1cb0f6]/10 text-[#1cb0f6]"
                                    : "text-[#afafaf] hover:bg-gray-50 hover:text-[#3c3c3c]",
                            )}
                        >
                            <Icon
                                size={20}
                                className={
                                    isActive
                                        ? "text-[#1cb0f6]"
                                        : "text-gray-400 group-hover:text-[#3c3c3c]"
                                }
                            />
                            {item.label}

                            {isActive && (
                                <motion.div
                                    layoutId="active-sidebar"
                                    className="absolute left-[-12px] h-8 w-1.5 rounded-r-full bg-[#1cb0f6]"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4">
                <div className="rounded-2xl border-2 border-dashed border-gray-100 p-4">
                    <p className="text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                        Superadmin
                    </p>
                    <p className="mt-1 truncate text-xs font-bold text-[#3c3c3c]">
                        Console Managed
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;
