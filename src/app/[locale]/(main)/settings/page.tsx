import { getFlags } from "@/lib/flags";
import SettingsPageClient from "./SettingsPageClient";

export default async function SettingsPage() {
    const flags = await getFlags();

    return <SettingsPageClient localeSwitchEnabled={flags.locale_switch_enabled} />;
}
