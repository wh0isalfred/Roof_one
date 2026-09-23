import type { Option } from "@/lib/options";
import type { Lead } from "./types";

export const LEAD_PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
] as const satisfies readonly Option[];

export type LeadPriority = (typeof LEAD_PRIORITY_OPTIONS)[number]["value"];

/**
 * Priority is derived from the homeowner's answers rather than stored, so it
 * can never drift from them.
 */
export function getLeadPriority(lead: Pick<Lead, "urgency">): LeadPriority {
  switch (lead.urgency) {
    case "emergency":
      return "high";
    case "planning":
      return "low";
    default:
      return "normal";
  }
}
