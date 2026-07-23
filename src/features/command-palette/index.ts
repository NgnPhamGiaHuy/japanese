/**
 * Command Palette Feature — Public API
 *
 * @remarks
 * A ⌘K/Ctrl+K launcher mounted once at the composition root. The launcher
 * owns the keydown listener and is cheap to keep mounted everywhere; the
 * actual cmdk UI (`CommandPalette`) is dynamically imported on first open
 * and stays internal — nothing outside this feature renders it directly.
 */
export { default as CommandPaletteLauncher } from "./components/CommandPaletteLauncher";
