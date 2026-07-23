"use client";

import { useTranslations } from "next-intl";

import { Menu } from "@base-ui/react/menu";
import { Check, ChevronDown } from "lucide-react";

import { ROLE_CONFIG } from "@/features/flashcard/utils/rbac";
import {
    resolveVisibilityColor,
    VISIBILITY_MAPPINGS,
    VisibilityLevel,
} from "@/features/flashcard/utils/visibility";
import { Button, Select } from "@/shared/components/ui";

import type { SelectOption } from "@/shared/components/ui";
import type { PrivacyMode } from "../hooks/useShareModal";

/**
 * Options for the public/link "Default role" picker.
 * Editor is intentionally excluded — public access is capped at commenter.
 */
const PUBLIC_ROLES: readonly ("viewer" | "commenter")[] = ["viewer", "commenter"] as const;

const PRIVACY_MODES: readonly PrivacyMode[] = ["restricted", "link", "public"] as const;

function levelForMode(mode: PrivacyMode): VisibilityLevel {
    if (mode === "public") return VisibilityLevel.PUBLIC;
    if (mode === "link") return VisibilityLevel.SHARED;
    return VisibilityLevel.PRIVATE;
}

interface SharePrivacyPickerProps {
    privacyMode: PrivacyMode;
    publicRole: "viewer" | "commenter";
    saving: boolean;
    themeHex: string;
    onChangePrivacyMode: (mode: PrivacyMode) => void;
    onChangePublicRole: (role: "viewer" | "commenter") => void;
}

/** "General access" section of ShareModal — privacy mode menu + default public role. */
const SharePrivacyPicker = ({
    privacyMode,
    publicRole,
    saving,
    themeHex,
    onChangePrivacyMode,
    onChangePublicRole,
}: SharePrivacyPickerProps) => {
    const t = useTranslations("ShareModal");
    const tDetail = useTranslations("FlashcardDetail");

    const publicRoleOptions: SelectOption<"viewer" | "commenter">[] = PUBLIC_ROLES.map((role) => ({
        value: role,
        label: tDetail(`roleName.${role}`),
        icon: ROLE_CONFIG[role].icon,
        color: ROLE_CONFIG[role].color,
    }));

    const currentVisibility = VISIBILITY_MAPPINGS[levelForMode(privacyMode)];

    return (
        <>
            <h3 className="text-text mb-4 border-t-2 border-gray-100 pt-6 text-xs font-black tracking-wider uppercase">
                {t("generalAccess")}
            </h3>

            <div className="mb-6 flex flex-col gap-4 rounded-2xl border-2 border-gray-100 p-4">
                <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        {(() => {
                            const Icon = currentVisibility.icon;
                            return (
                                <Icon
                                    style={{
                                        color: resolveVisibilityColor(currentVisibility, themeHex),
                                    }}
                                    size={20}
                                />
                            );
                        })()}
                    </div>

                    <div className="relative flex-1">
                        {/* Privacy picker */}
                        <Menu.Root>
                            <Menu.Trigger
                                disabled={saving}
                                render={
                                    <Button
                                        variant="ghost"
                                        className="text-text group flex w-fit items-center gap-2 !py-1 !pr-2 !text-lg !font-black hover:bg-gray-100"
                                    />
                                }
                            >
                                {t(`visibility.${currentVisibility.level}.label`)}
                                <ChevronDown
                                    size={20}
                                    className="text-gray-400 transition-transform group-data-[popup-open]:rotate-180"
                                />
                            </Menu.Trigger>

                            <Menu.Portal>
                                <Menu.Positioner
                                    side="bottom"
                                    align="start"
                                    sideOffset={4}
                                    className="z-50"
                                >
                                    <Menu.Popup className="fade-in zoom-in-95 data-[ending-style]:fade-out data-[ending-style]:zoom-out-95 w-72 overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-lg transition-[opacity,transform] duration-150 outline-none data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
                                        <Menu.RadioGroup
                                            value={privacyMode}
                                            onValueChange={(mode) =>
                                                onChangePrivacyMode(mode as PrivacyMode)
                                            }
                                        >
                                            {PRIVACY_MODES.map((mode) => {
                                                const v = VISIBILITY_MAPPINGS[levelForMode(mode)];
                                                const Icon = v.icon;

                                                return (
                                                    <Menu.RadioItem
                                                        key={mode}
                                                        value={mode}
                                                        className="flex w-full cursor-pointer items-center gap-3 border-b-2 border-gray-50 p-4 text-left outline-none select-none last:border-b-0 hover:bg-gray-50 data-[highlighted]:bg-gray-50"
                                                    >
                                                        <Icon
                                                            className="shrink-0"
                                                            style={{
                                                                color: resolveVisibilityColor(
                                                                    v,
                                                                    themeHex,
                                                                ),
                                                            }}
                                                            size={20}
                                                        />
                                                        <div className="flex-1 text-left">
                                                            <div className="text-text font-black">
                                                                {t(`visibility.${v.level}.label`)}
                                                            </div>
                                                            <div className="text-xs font-bold text-gray-400">
                                                                {t(
                                                                    `visibility.${v.level}.description`,
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Menu.RadioItemIndicator className="shrink-0">
                                                            <Check
                                                                style={{
                                                                    color: resolveVisibilityColor(
                                                                        v,
                                                                        themeHex,
                                                                    ),
                                                                }}
                                                                size={20}
                                                            />
                                                        </Menu.RadioItemIndicator>
                                                    </Menu.RadioItem>
                                                );
                                            })}
                                        </Menu.RadioGroup>
                                    </Menu.Popup>
                                </Menu.Positioner>
                            </Menu.Portal>
                        </Menu.Root>

                        <p className="text-muted mt-1 text-sm font-bold">
                            {t(`visibility.${currentVisibility.level}.description`)}
                        </p>
                    </div>
                </div>

                {/* Role picker — shown for link and public modes, capped at commenter */}
                {privacyMode !== "restricted" && (
                    <div className="relative ml-14 flex items-center justify-between border-t-2 border-gray-100 pt-3">
                        <span className="text-sm font-bold text-gray-400">{t("defaultRole")}</span>
                        <Select
                            value={publicRole || "viewer"}
                            options={publicRoleOptions}
                            onChange={(r) => onChangePublicRole(r as "viewer" | "commenter")}
                            disabled={saving}
                            themeHex={themeHex}
                            align="right"
                        />
                    </div>
                )}
            </div>
        </>
    );
};

export default SharePrivacyPicker;
