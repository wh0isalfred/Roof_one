import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { LeadFilters } from "@/components/admin/LeadFilters";
import { LeadsTable } from "@/components/admin/LeadsTable";
import { LEAD_STATUS_OPTIONS } from "@/lib/leads/options";
import { getLeadCountsByStatus, getLeads } from "@/lib/leads/queries";
import { isOptionValue } from "@/lib/options";

export const metadata: Metadata = {
  title: "Leads",
};

export default async function LeadsPage({
  searchParams,
}: PageProps<"/admin/leads">) {
  const { status: statusParam, q } = await searchParams;
  const status =
    typeof statusParam === "string" &&
    isOptionValue(LEAD_STATUS_OPTIONS, statusParam)
      ? statusParam
      : undefined;
  const search = typeof q === "string" && q.trim() !== "" ? q.trim() : undefined;

  const [leads, counts] = await Promise.all([
    getLeads({ status, search }),
    getLeadCountsByStatus(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Leads"
        description="Every assessment request, newest first."
      />
      <LeadFilters status={status} search={search} counts={counts} />
      <div className="mt-6">
        <LeadsTable leads={leads} />
      </div>
    </>
  );
}
