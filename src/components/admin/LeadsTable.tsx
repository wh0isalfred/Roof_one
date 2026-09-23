import Link from "next/link";
import { formatDateTime, formatLeadReference } from "@/lib/format";
import { ISSUE_TYPE_OPTIONS } from "@/lib/leads/options";
import { getLeadPriority } from "@/lib/leads/priority";
import type { Lead } from "@/lib/leads/types";
import { getOptionLabel } from "@/lib/options";
import { LeadPriorityBadge, LeadStatusBadge } from "./LeadBadges";

const headerCellClasses = "px-4 py-3 font-semibold";

export function LeadsTable({ leads }: { leads: readonly Lead[] }) {
  if (leads.length === 0) {
    return (
      <p className="border border-dashed border-control px-6 py-10 text-center text-ink-muted">
        No leads match these filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-canvas text-xs tracking-eyebrow text-ink-muted uppercase">
          <tr>
            <th scope="col" className={headerCellClasses}>
              Lead
            </th>
            <th scope="col" className={headerCellClasses}>
              Issue
            </th>
            <th scope="col" className={`${headerCellClasses} hidden md:table-cell`}>
              Priority
            </th>
            <th scope="col" className={`${headerCellClasses} hidden lg:table-cell`}>
              Location
            </th>
            <th scope="col" className={`${headerCellClasses} hidden sm:table-cell`}>
              Received
            </th>
            <th scope="col" className={headerCellClasses}>
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {leads.map((lead) => (
            <tr key={lead.id} className="align-top">
              <td className="px-4 py-3">
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="font-semibold underline-offset-4 hover:underline"
                >
                  {lead.name}
                </Link>
                <div className="mt-0.5 text-xs text-ink-muted">
                  #{formatLeadReference(lead.id)}
                </div>
              </td>
              <td className="px-4 py-3">
                {getOptionLabel(ISSUE_TYPE_OPTIONS, lead.issue_type)}
              </td>
              <td className="hidden px-4 py-3 md:table-cell">
                <LeadPriorityBadge priority={getLeadPriority(lead)} />
              </td>
              <td className="hidden px-4 py-3 lg:table-cell">
                {[lead.city, lead.state].filter(Boolean).join(", ") || "—"}
              </td>
              <td className="hidden px-4 py-3 whitespace-nowrap text-ink-muted sm:table-cell">
                {formatDateTime(lead.created_at)}
              </td>
              <td className="px-4 py-3">
                <LeadStatusBadge status={lead.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
