import { getSettings } from "@/actions/settings";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const settings = await getSettings();
  const serialized = settings.map((s: typeof settings[0]) => ({
    id: s.id,
    key: s.key,
    value: s.value,
    type: s.type,
    group: s.group,
  }));
  return <SettingsClient settings={serialized} />;
}
