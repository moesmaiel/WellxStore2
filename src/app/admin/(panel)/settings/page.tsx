import { getSettings } from "@/lib/repo";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Store name and currency. Products can override the currency individually."
      />
      <SettingsForm settings={settings} />
    </>
  );
}
