"use client";

import { useTranslations } from "next-intl";

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

interface SharePrivacyPickerProps {
    privacyMode: PrivacyMode;
    publicRole: "viewer" | "commenter";
    saving: boolean;
    themeHex: string;
    openPrivacyMenu: boolean;
    onTogglePrivacyMenu: () => void;
    onClosePrivacyMenu: () => void;
    onChangePrivacyMode: (mode: PrivacyMode) => void;
    onChangePublicRole: (role: "viewer" | "commenter") => void;
}

/** "General access" section of ShareModal — privacy mode dropdown + default public role. */
const SharePrivacyPicker = ({
    privacyMode,
    publicRole,
    saving,
    themeHex,
    openPrivacyMenu,
    onTogglePrivacyMenu,
    onClosePrivacyMenu,
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

    const currentLevel =
        privacyMode === "public"
            ? VisibilityLevel.PUBLIC
            : privacyMode === "link"
              ? VisibilityLevel.SHARED
              : VisibilityLevel.PRIVATE;
    const currentVisibility = VISIBILITY_MAPPINGS[currentLevel];

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
                        <Button
                            variant="ghost"
                            className="text-text flex w-fit items-center gap-2 !py-1 !pr-2 !text-lg !font-black hover:bg-gray-100"
                            onClick={onTogglePrivacyMenu}
                            disabled={saving}
                        >
                            {t(`visibility.${currentVisibility.level}.label`)}
                            <ChevronDown
                                size={20}
                                className={`text-gray-400 transition-transform ${openPrivacyMenu ? "rotate-180" : ""}`}
                            />
                        </Button>

                        {openPrivacyMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={onClosePrivacyMenu} />
                                <div className="animate-in fade-in zoom-in-95 absolute top-10 left-0 z-50 w-72 overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-lg">
                                    {(["restricted", "link", "public"] as const).map((mode) => {
                                        const level =
                                            mode === "public"
                                                ? VisibilityLevel.PUBLIC
                                                : mode === "link"
                                                  ? VisibilityLevel.SHARED
                                                  : VisibilityLevel.PRIVATE;
                                        const v = VISIBILITY_MAPPINGS[level];
                                        const Icon = v.icon;
                                        const isSelected = privacyMode === mode;

                                        return (
                                            <Button
                                                key={mode}
                                                variant="ghost"
                                                className="flex w-full items-center !justify-start gap-3 !rounded-none border-b-2 border-gray-50 !p-4 !text-left shadow-none hover:bg-gray-50 hover:shadow-none"
                                                onClick={() => {
                                                    onChangePrivacyMode(mode);
                                                    onClosePrivacyMenu();
                                                }}
                                            >
                                                <Icon
                                                    className="shrink-0"
                                                    style={{
                                                        color: resolveVisibilityColor(v, themeHex),
                                                    }}
                                                    size={20}
                                                />
                                                <div className="flex-1 text-left">
                                                    <div className="text-text font-black">
                                                        {t(`visibility.${v.level}.label`)}
                                                    </div>
                                                    <div className="text-xs font-bold text-gray-400">
                                                        {t(`visibility.${v.level}.description`)}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <Check
                                                        style={{
                                                            color: resolveVisibilityColor(
                                                                v,
                                                                themeHex,
                                                            ),
                                                        }}
                                                        size={20}
                                                        className="shrink-0"
                                                    />
                                                )}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </>
                        )}

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
