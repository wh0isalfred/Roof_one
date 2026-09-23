import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DetailList, Panel } from "@/components/admin/Panel";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Settings",
};

const CONNECTIONS = [
  {
    name: "Database",
    description: "Supabase stores leads, messages, photos, and settings.",
  },
  {
    name: "Team sign-in",
    description: "Supabase Auth controls who can open the admin.",
  },
  {
    name: "Email",
    description: "Sends confirmation and follow-up emails.",
  },
  {
    name: "Text messages",
    description: "Sends confirmation and follow-up texts.",
  },
  {
    name: "Roofing Advisor AI",
    description: "Optional. The assessment works without it.",
  },
];

export default function SettingsPage() {
  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Company details and connected services."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel id="company" title="Company">
          <DetailList
            items={[
              { label: "Name", value: siteConfig.name },
              { label: "Phone", value: siteConfig.phone.display },
            ]}
          />
          <p className="mt-4 text-sm text-ink-muted">
            Set in <code className="text-ink">src/config/site.ts</code> for now.
          </p>
        </Panel>

        <Panel id="connections" title="Connections">
          <ul className="divide-y divide-line">
            {CONNECTIONS.map((connection) => (
              <li
                key={connection.name}
                className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-semibold">{connection.name}</p>
                  <p className="text-sm text-ink-muted">
                    {connection.description}
                  </p>
                </div>
                <span className="shrink-0 rounded-sm bg-subtle px-2 py-0.5 text-xs font-semibold text-ink-muted">
                  Not connected
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
