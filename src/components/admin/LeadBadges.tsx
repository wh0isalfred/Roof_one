import { cn } from "@/lib/cn";
import { LEAD_STATUS_OPTIONS, type LeadStatus } from "@/lib/leads/options";
import { LEAD_PRIORITY_OPTIONS, type LeadPriority } from "@/lib/leads/priority";
import { getOptionLabel } from "@/lib/options";

const STATUS_CLASSES: Record<LeadStatus, string> = {
  new: "bg-accent-soft text-accent-strong",
  contacted: "bg-subtle text-ink",
  appointment: "bg-brand-soft text-brand",
  estimate: "bg-brand-soft text-brand",
  won: "bg-brand text-canvas",
  lost: "bg-subtle text-ink-muted",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        STATUS_CLASSES[status],
      )}
    >
      {getOptionLabel(LEAD_STATUS_OPTIONS, status)}
    </span>
  );
}

const PRIORITY_DOT_CLASSES: Record<LeadPriority, string> = {
  high: "bg-accent",
  normal: "bg-control",
  low: "bg-line",
};

export function LeadPriorityBadge({ priority }: { priority: LeadPriority }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
      <span
        aria-hidden="true"
        className={cn("size-2 rounded-full", PRIORITY_DOT_CLASSES[priority])}
      />
      {getOptionLabel(LEAD_PRIORITY_OPTIONS, priority)} priority
    </span>
  );
}
