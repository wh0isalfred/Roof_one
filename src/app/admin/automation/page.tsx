import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Switch } from "@/components/admin/Switch";
import { AUTOMATION_ACTIONS } from "@/lib/automation/actions";
import { getAutomationSettings } from "@/lib/automation/queries";

export const metadata: Metadata = {
  title: "Automation",
};

export default async function AutomationPage() {
  const settings = await getAutomationSettings();

  return (
    <>
      <AdminPageHeader
        title="Automation"
        description="Optional automated messages. Nothing is sent unless automation is on here and active for the lead."
      />

      <p className="mt-6 text-sm text-ink-muted">
        Read-only for now. Saving settings and sending messages turn on once the
        database and email/SMS providers are connected.
      </p>

      {/* Saved to the automation_settings table in a later stage. */}
      <form className="mt-6">
        <fieldset disabled className="grid gap-6">
          <legend className="sr-only">Automation settings</legend>

          <div className="flex items-start justify-between gap-6 border border-line bg-surface p-5">
            <div>
              <label htmlFor="automation-enabled" className="font-semibold">
                Automated communication
              </label>
              <p id="automation-enabled-description" className="mt-1 text-sm text-ink-muted">
                The master switch. When it’s off, no automated email or text goes
                to any lead.
              </p>
            </div>
            <Switch
              id="automation-enabled"
              checked={settings.enabled}
              describedBy="automation-enabled-description"
            />
          </div>

          <section aria-labelledby="automation-actions-heading">
            <h2 id="automation-actions-heading" className="text-sm font-semibold">
              Messages
            </h2>
            <ul className="mt-3 divide-y divide-line border border-line bg-surface">
              {AUTOMATION_ACTIONS.map((action) => {
                const id = `automation-${action.key}`;
                return (
                  <li
                    key={action.key}
                    className="flex items-start justify-between gap-6 p-5"
                  >
                    <div>
                      <label htmlFor={id} className="font-semibold">
                        {action.label}
                      </label>
                      <p id={`${id}-description`} className="mt-1 text-sm text-ink-muted">
                        {action.description}
                      </p>
                    </div>
                    <Switch
                      id={id}
                      checked={settings[action.key]}
                      describedBy={`${id}-description`}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        </fieldset>
      </form>
    </>
  );
}
