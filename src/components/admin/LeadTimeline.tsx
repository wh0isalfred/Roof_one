import { formatDateTime } from "@/lib/format";
import {
  LEAD_EVENT_TYPE_OPTIONS,
  LEAD_STATUS_OPTIONS,
} from "@/lib/leads/options";
import type { LeadEvent } from "@/lib/leads/types";
import { getOptionLabel, isOptionValue } from "@/lib/options";

/** Extra detail for events whose metadata is worth showing. */
function describeEvent(event: LeadEvent): string | null {
  const { metadata } = event;

  if (event.event_type === "status_changed") {
    const { from, to } = metadata;
    if (
      typeof from === "string" &&
      typeof to === "string" &&
      isOptionValue(LEAD_STATUS_OPTIONS, from) &&
      isOptionValue(LEAD_STATUS_OPTIONS, to)
    ) {
      return `${getOptionLabel(LEAD_STATUS_OPTIONS, from)} → ${getOptionLabel(LEAD_STATUS_OPTIONS, to)}`;
    }
  }

  if (event.event_type === "photo_uploaded" && typeof metadata.count === "number") {
    return `${metadata.count} photo${metadata.count === 1 ? "" : "s"}`;
  }

  return null;
}

export function LeadTimeline({ events }: { events: readonly LeadEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink-muted">No activity yet.</p>;
  }

  return (
    <ol className="grid gap-4 border-l border-line pl-5">
      {events.map((event) => {
        const detail = describeEvent(event);
        return (
          <li key={event.id} className="relative">
            <span
              aria-hidden="true"
              className="absolute top-1.5 -left-6 size-2 rounded-full bg-control"
            />
            <p className="text-sm font-medium">
              {getOptionLabel(LEAD_EVENT_TYPE_OPTIONS, event.event_type)}
              {detail && (
                <span className="font-normal text-ink-muted"> · {detail}</span>
              )}
            </p>
            <time
              dateTime={event.created_at}
              className="text-xs text-ink-muted"
            >
              {formatDateTime(event.created_at)}
            </time>
          </li>
        );
      })}
    </ol>
  );
}
