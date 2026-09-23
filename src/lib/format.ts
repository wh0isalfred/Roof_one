import type { CalendarDate, Timestamp } from "@/lib/leads/types";

// Timestamps render in the server's time zone (UTC on Vercel) with the zone
// name shown, so admin times are never ambiguous. Switch to the company's
// time zone once it's known.
const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const calendarDateFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDateTime(value: Timestamp): string {
  return dateTimeFormat.format(new Date(value));
}

export function formatDate(value: Timestamp): string {
  return dateFormat.format(new Date(value));
}

/** Formats a YYYY-MM-DD date without shifting it across time zones. */
export function formatCalendarDate(value: CalendarDate): string {
  return calendarDateFormat.format(new Date(`${value}T00:00:00Z`));
}

/** Short, human-friendly reference for a lead's UUID. */
export function formatLeadReference(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
