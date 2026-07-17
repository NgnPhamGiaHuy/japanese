"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Dialog } from "@base-ui/react/dialog";
import { Command } from "cmdk";
import { Search } from "lucide-react";

import { useAdminRole } from "@/features/admin/context/AdminContext";
import { ADMIN_ACTIONS, MAIN_ACTIONS } from "../data/actions";

import type { CommandAction } from "../data/actions";

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const GROUP_HEADING_CLASSES =
    "[&_[cmdk-group-heading]]:text-muted [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:uppercase";

const ITEM_CLASSES =
    "text-text data-[selected=true]:bg-both/10 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold outline-none";

/**
 * Global ⌘K command palette. Wrapped in the same Base UI Dialog primitive as
 * Modal.tsx (E6-T2) rather than cmdk's own Radix-based Command.Dialog, so it
 * inherits the app's one overlay system instead of a second one.
 */
const CommandPalette = ({ open, onOpenChange }: CommandPaletteProps) => {
    const router = useRouter();
    const { role } = useAdminRole();
    const [search, setSearch] = useState("");

    const handleOpenChange = (next: boolean) => {
        onOpenChange(next);
        if (!next) setSearch("");
    };

    const handleSelect = (action: CommandAction) => {
        handleOpenChange(false);
        router.push(action.href);
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
                <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh] sm:p-6 sm:pt-[15vh]">
                    <Dialog.Popup
                        aria-modal="true"
                        aria-label="Command palette"
                        className="pointer-events-auto relative flex max-h-[70vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border-2 border-b-8 border-gray-200 bg-white shadow-2xl transition-all duration-200 data-[ending-style]:translate-y-3 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-3 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
                    >
                        <Command
                            label="Command palette"
                            className="flex min-h-0 flex-1 flex-col"
                            loop
                        >
                            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                                <Search size={18} className="text-muted shrink-0" />
                                <Command.Input
                                    autoFocus
                                    value={search}
                                    onValueChange={setSearch}
                                    placeholder="Search pages and actions…"
                                    className="text-text placeholder:text-muted w-full bg-transparent text-base font-medium outline-none"
                                />
                            </div>
                            <Command.List className="flex-1 overflow-y-auto p-2">
                                <Command.Empty className="text-muted px-4 py-8 text-center text-sm font-bold">
                                    No results found.
                                </Command.Empty>
                                <Command.Group heading="Navigate" className={GROUP_HEADING_CLASSES}>
                                    {MAIN_ACTIONS.map((action) => (
                                        <Command.Item
                                            key={action.id}
                                            value={action.label}
                                            keywords={action.keywords}
                                            onSelect={() => handleSelect(action)}
                                            className={ITEM_CLASSES}
                                        >
                                            <action.icon
                                                size={16}
                                                className="text-muted shrink-0"
                                            />
                                            {action.label}
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                                {role && (
                                    <Command.Group
                                        heading="Admin"
                                        className={GROUP_HEADING_CLASSES}
                                    >
                                        {ADMIN_ACTIONS.map((action) => (
                                            <Command.Item
                                                key={action.id}
                                                value={action.label}
                                                keywords={action.keywords}
                                                onSelect={() => handleSelect(action)}
                                                className={ITEM_CLASSES}
                                            >
                                                <action.icon
                                                    size={16}
                                                    className="text-muted shrink-0"
                                                />
                                                {action.label}
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}
                            </Command.List>
                        </Command>
                    </Dialog.Popup>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default CommandPalette;
