/**
 * SettingsMenu — Dropdown settings panel
 *
 * @remarks
 * Reusable settings menu with sections for preferences and danger zone actions.
 */

import { Settings, Trash2, Type, Volume2 } from "lucide-react";

import Button from "./Button";

interface SettingToggle {
    label: string;
    icon: typeof Volume2;
    value: boolean;
    onChange: () => void;
}

interface DangerAction {
    label: string;
    onConfirm: () => void;
    confirmText: string;
    cancelText?: string;
}

interface SettingsMenuProps {
    isOpen: boolean;
    onToggle: () => void;
    primaryBg: string;
    audioToggle?: SettingToggle;
    displayToggle?: SettingToggle;
    dangerAction?: DangerAction & {
        showConfirm: boolean;
        onRequestConfirm: () => void;
        onCancelConfirm: () => void;
    };
    buttonClassName?: string;
}

export function SettingsMenu({
    isOpen,
    onToggle,
    primaryBg,
    audioToggle,
    displayToggle,
    dangerAction,
    buttonClassName = "",
}: SettingsMenuProps) {
    return (
        <div className="relative">
            <Button
                variant="ghost"
                onClick={onToggle}
                className={`rounded-xl border-2 p-2.5 shadow-none transition-all duration-200 md:rounded-2xl md:p-3 ${
                    isOpen
                        ? "border-gray-300 bg-gray-100 text-gray-800"
                        : "border-gray-200 bg-white text-gray-500 hover:text-gray-700"
                } ${buttonClassName}`}
                title="Settings"
                icon={Settings}
                iconSize={20}
                iconClassName="md:h-6 md:w-6"
            />

            {isOpen && (
                <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 z-50 mt-2 w-56 rounded-2xl border-2 border-gray-200 bg-white p-2 shadow-xl duration-200">
                    {audioToggle && (
                        <>
                            <div className="mb-1 border-b border-gray-100 px-3 py-2 text-xs font-black tracking-wider text-gray-500 uppercase">
                                Audio Preferences
                            </div>
                            <Button
                                variant="ghost"
                                onClick={audioToggle.onChange}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-bold text-[#3c3c3c] shadow-none transition-colors hover:bg-gray-50 hover:shadow-none active:translate-y-0"
                            >
                                <span className="flex items-center gap-2">
                                    <audioToggle.icon size={16} className="text-gray-500" />{" "}
                                    {audioToggle.label}
                                </span>
                                <div
                                    className={`flex h-6 w-10 items-center rounded-full px-1 transition-colors ${audioToggle.value ? primaryBg : "bg-gray-200"}`}
                                >
                                    <div
                                        className={`h-4 w-4 rounded-full bg-white transition-transform ${audioToggle.value ? "translate-x-4" : "translate-x-0"}`}
                                    />
                                </div>
                            </Button>
                        </>
                    )}

                    {displayToggle && (
                        <>
                            <div className="mt-2 mb-1 border-b border-gray-100 px-3 py-2 text-xs font-black tracking-wider text-gray-500 uppercase">
                                Display Preferences
                            </div>
                            <Button
                                variant="ghost"
                                onClick={displayToggle.onChange}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-bold text-[#3c3c3c] shadow-none transition-colors hover:bg-gray-50 hover:shadow-none active:translate-y-0"
                            >
                                <span className="flex items-center gap-2">
                                    <displayToggle.icon size={16} className="text-gray-500" />{" "}
                                    {displayToggle.label}
                                </span>
                                <div
                                    className={`flex h-6 w-10 items-center rounded-full px-1 transition-colors ${displayToggle.value ? primaryBg : "bg-gray-200"}`}
                                >
                                    <div
                                        className={`h-4 w-4 rounded-full bg-white transition-transform ${displayToggle.value ? "translate-x-4" : "translate-x-0"}`}
                                    />
                                </div>
                            </Button>
                        </>
                    )}

                    {dangerAction && (
                        <>
                            <div className="mt-2 mb-1 border-b border-gray-100 px-3 py-2 text-xs font-black tracking-wider text-red-500 uppercase">
                                Danger Zone
                            </div>
                            {!dangerAction.showConfirm ? (
                                <Button
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        dangerAction.onRequestConfirm();
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-bold text-red-500 shadow-none transition-colors hover:bg-red-50 hover:shadow-none active:translate-y-0"
                                    icon={Trash2}
                                    iconSize={16}
                                >
                                    {dangerAction.label}
                                </Button>
                            ) : (
                                <div className="animate-in zoom-in mt-1 flex flex-col gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 duration-200">
                                    <span className="text-xs font-bold text-red-600">
                                        Are you sure? This cannot be undone.
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="primary"
                                            color="red"
                                            onClick={dangerAction.onConfirm}
                                            className="flex-1 rounded-lg py-1.5 text-xs font-bold shadow-none hover:shadow-none active:translate-y-0"
                                        >
                                            {dangerAction.confirmText}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                dangerAction.onCancelConfirm();
                                            }}
                                            className="flex-1 rounded-lg border border-gray-200 bg-white py-1.5 text-xs font-bold text-gray-700 shadow-none hover:bg-gray-50 hover:shadow-none active:translate-y-0"
                                        >
                                            {dangerAction.cancelText || "Cancel"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
