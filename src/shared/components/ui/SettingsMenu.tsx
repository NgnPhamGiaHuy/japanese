/**
 * Dropdown settings panel for managing application preferences.
 *
 * @remarks
 * Reusable settings menu with sections for preferences and danger zone actions.
 * Supports toggles for audio/display and confirmation workflows for destructive actions.
 *
 * @example
 * <SettingsMenu
 *   isOpen={isMenuOpen}
 *   onToggle={() => setIsMenuOpen(!isMenuOpen)}
 *   primaryBg="bg-blue-500"
 *   audioToggle={{ label: "Autoplay Audio", icon: Volume2, value: true, onChange: handleToggle }}
 * />
 *
 * This menu exposes one audio toggle. The full set of audio controls — sound effects,
 * pronunciation, and auto-play, each independent — lives on the Settings page.
 */
import { Menu } from "@base-ui/react/menu";
import { Settings, Trash2, Volume2 } from "lucide-react";

import Button from "./Button";

/** Configuration for a toggleable setting. */
interface SettingToggle {
    /** Label to display next to the toggle. */
    label: string;
    /** Icon element to display. */
    icon: typeof Volume2;
    /** Current state of the toggle. */
    value: boolean;
    /** Triggered when the toggle is clicked. */
    onChange: () => void;
}

/** Configuration for a destructive action. */
interface DangerAction {
    /** Label for the destructive action button. */
    label: string;
    /** Triggered when the action is confirmed. */
    onConfirm: () => void;
    /** Text for the confirmation button. */
    confirmText: string;
    /** Text for the cancellation button (default: "Cancel"). */
    cancelText?: string;
}

/** Attributes for rendering a SettingsMenu. */
interface SettingsMenuProps {
    /** Whether the menu is currently visible. */
    isOpen: boolean;
    /** Triggered to open or close the menu. */
    onToggle: () => void;
    /** Tailwind background color class for active state highlighting. */
    primaryBg: string;
    /** Optional audio-related setting configuration. */
    audioToggle?: SettingToggle;
    /** Optional display-related setting configuration. */
    displayToggle?: SettingToggle;
    /** Optional destructive action configuration with confirmation logic. */
    dangerAction?: DangerAction & {
        showConfirm: boolean;
        onRequestConfirm: () => void;
        onCancelConfirm: () => void;
    };
    /** Additional CSS classes for the trigger button. */
    buttonClassName?: string;
}

const MENU_ITEM_CLASS =
    "text-text flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-bold shadow-none transition-colors hover:bg-gray-50 data-[highlighted]:bg-gray-50 hover:shadow-none active:translate-y-0";

const SettingsMenu = ({
    isOpen,
    onToggle,
    primaryBg,
    audioToggle,
    displayToggle,
    dangerAction,
    buttonClassName = "",
}: SettingsMenuProps) => {
    return (
        <Menu.Root open={isOpen} onOpenChange={() => onToggle()}>
            <Menu.Trigger
                render={
                    <Button
                        variant="ghost"
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
                }
            />

            <Menu.Portal>
                <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
                    <Menu.Popup className="w-56 origin-top-right rounded-2xl border-2 border-gray-200 bg-white p-2 shadow-xl transition-[opacity,transform] duration-200 outline-none data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
                        {audioToggle && (
                            <>
                                <div className="mb-1 border-b border-gray-100 px-3 py-2 text-xs font-black tracking-wider text-gray-500 uppercase">
                                    Audio Preferences
                                </div>
                                <Menu.CheckboxItem
                                    nativeButton
                                    checked={audioToggle.value}
                                    onCheckedChange={() => audioToggle.onChange()}
                                    render={<Button variant="ghost" className={MENU_ITEM_CLASS} />}
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
                                </Menu.CheckboxItem>
                            </>
                        )}

                        {displayToggle && (
                            <>
                                <div className="mt-2 mb-1 border-b border-gray-100 px-3 py-2 text-xs font-black tracking-wider text-gray-500 uppercase">
                                    Display Preferences
                                </div>
                                <Menu.CheckboxItem
                                    nativeButton
                                    checked={displayToggle.value}
                                    onCheckedChange={() => displayToggle.onChange()}
                                    render={<Button variant="ghost" className={MENU_ITEM_CLASS} />}
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
                                </Menu.CheckboxItem>
                            </>
                        )}

                        {dangerAction && (
                            <>
                                <div className="text-danger mt-2 mb-1 border-b border-gray-100 px-3 py-2 text-xs font-black tracking-wider uppercase">
                                    Danger Zone
                                </div>
                                {!dangerAction.showConfirm ? (
                                    <Menu.Item
                                        nativeButton
                                        closeOnClick={false}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dangerAction.onRequestConfirm();
                                        }}
                                        render={
                                            <Button
                                                variant="ghost"
                                                className="text-danger hover:bg-danger-bg data-[highlighted]:bg-danger-bg flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-bold shadow-none transition-colors hover:shadow-none active:translate-y-0"
                                                icon={Trash2}
                                                iconSize={16}
                                            />
                                        }
                                    >
                                        {dangerAction.label}
                                    </Menu.Item>
                                ) : (
                                    <div className="animate-in zoom-in border-danger/20 bg-danger-bg mt-1 flex flex-col gap-2 rounded-xl border px-3 py-2 duration-200">
                                        <span className="text-danger text-xs font-bold">
                                            Are you sure? This cannot be undone.
                                        </span>
                                        <div className="flex gap-2">
                                            <Menu.Item
                                                nativeButton
                                                closeOnClick={false}
                                                onClick={dangerAction.onConfirm}
                                                render={
                                                    <Button
                                                        variant="primary"
                                                        color="red"
                                                        className="flex-1 rounded-lg py-1.5 text-xs font-bold shadow-none hover:shadow-none active:translate-y-0"
                                                    />
                                                }
                                            >
                                                {dangerAction.confirmText}
                                            </Menu.Item>
                                            <Menu.Item
                                                nativeButton
                                                closeOnClick={false}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    dangerAction.onCancelConfirm();
                                                }}
                                                render={
                                                    <Button
                                                        variant="ghost"
                                                        className="flex-1 rounded-lg border border-gray-200 bg-white py-1.5 text-xs font-bold text-gray-700 shadow-none hover:bg-gray-50 hover:shadow-none active:translate-y-0 data-[highlighted]:bg-gray-50"
                                                    />
                                                }
                                            >
                                                {dangerAction.cancelText || "Cancel"}
                                            </Menu.Item>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </Menu.Popup>
                </Menu.Positioner>
            </Menu.Portal>
        </Menu.Root>
    );
};

export default SettingsMenu;
