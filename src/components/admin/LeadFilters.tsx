import { Search } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { LEAD_STATUS_OPTIONS, type LeadStatus } from "@/lib/leads/options";

interface LeadFiltersProps {
  status?: LeadStatus;
  search?: string;
  counts: Record<LeadStatus, number>;
}

function leadsHref(status: LeadStatus | undefined, search: string | undefined) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("q", search);
  const query = params.toString();
  return query ? (`/admin/leads?${query}` as const) : ("/admin/leads" as const);
}

/** Status tabs and search. Filters live in the URL, so they're shareable and work without JavaScript. */
export function LeadFilters({ status, search, counts }: LeadFiltersProps) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const tabs = [
    { value: undefined, label: "All", count: total },
    ...LEAD_STATUS_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
      count: counts[option.value],
    })),
  ];

  return (
    <div className="mt-6 grid grid-cols-1 gap-4">
      <nav aria-label="Filter by status">
        <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {tabs.map((tab) => {
            const isCurrent = tab.value === status;
            return (
              <li key={tab.label}>
                <Link
                  href={leadsHref(tab.value, search)}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap",
                    isCurrent
                      ? "bg-ink text-canvas"
                      : "text-ink-muted hover:bg-subtle hover:text-ink",
                  )}
                >
                  {tab.label}
                  <span className={isCurrent ? "text-subtle" : "text-ink-muted"}>
                    {tab.count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Form action="/admin/leads" className="flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="lead-search" className="sr-only">
          Search leads
        </label>
        <div className="relative max-w-md flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            id="lead-search"
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Name, email, phone, city, or ZIP"
            className="h-11 w-full rounded-md border border-control bg-surface pr-3 pl-9 text-base sm:text-sm"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </Form>
    </div>
  );
}
