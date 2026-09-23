import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { LeadsTable } from "@/components/admin/LeadsTable";
import { siteConfig } from "@/config/site";
import { getAutomationSettings } from "@/lib/automation/queries";
import { LEAD_STATUS_OPTIONS } from "@/lib/leads/options";
import { getLeadCountsByStatus, getLeads } from "@/lib/leads/queries";

// The admin layout's title template only applies to child routes, so this
// page (in the same segment) spells out its full title.
export const metadata: Metadata = {
  title: { absolute: `Overview · Admin · ${siteConfig.name}` },
};

export default async function AdminOverviewPage() {
  const [counts, newestLeads, automation] = await Promise.all([
    getLeadCountsByStatus(),
    getLeads({ limit: 5 }),
    getAutomationSettings(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Overview"
        description="Where every lead stands right now."
      />

      <section aria-labelledby="pipeline-heading" className="mt-8">
        <h2 id="pipeline-heading" className="text-sm font-semibold">
          Pipeline
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
          {LEAD_STATUS_OPTIONS.map((status) => (
            <li key={status.value} className="bg-surface">
              <Link
                href={`/admin/leads?status=${status.value}`}
                className="block px-4 py-4 hover:bg-canvas"
              >
                <span className="block text-sm text-ink-muted">
                  {status.label}
                </span>
                <span className="mt-1 block font-display text-3xl font-bold">
                  {counts[status.value]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="newest-heading" className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 id="newest-heading" className="text-sm font-semibold">
            Newest leads
          </h2>
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
          >
            All leads
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <div className="mt-3">
          <LeadsTable leads={newestLeads} />
        </div>
      </section>

      <section
        aria-labelledby="automation-heading"
        className="mt-10 flex flex-col gap-3 border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 id="automation-heading" className="text-sm font-semibold">
            Automated follow-ups are {automation.enabled ? "on" : "off"}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {automation.enabled
              ? "Leads with automation active receive the messages turned on in Automation."
              : "Nothing is sent automatically. The team handles every follow-up."}
          </p>
        </div>
        <Link
          href="/admin/automation"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
        >
          Automation settings
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </section>
    </>
  );
}
