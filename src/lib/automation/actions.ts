import type { Lead } from "@/lib/leads/types";
import type { AutomationActionKey, AutomationSettings } from "./types";

export interface AutomationAction {
  key: AutomationActionKey;
  label: string;
  description: string;
}

/**
 * Every automated message the system can send, in the order they'd happen.
 * Provider-specific delivery (email, SMS) is not part of this module and
 * will live behind its own adapters.
 */
export const AUTOMATION_ACTIONS: readonly AutomationAction[] = [
  {
    key: "confirmation_email",
    label: "Confirmation email",
    description: "Sent when a homeowner finishes the assessment.",
  },
  {
    key: "confirmation_sms",
    label: "Confirmation text",
    description: "Sent when a homeowner finishes the assessment.",
  },
  {
    key: "missed_call_followup",
    label: "Missed-call follow-up",
    description: "Sent when a call from a lead goes unanswered.",
  },
  {
    key: "followup_30m",
    label: "30-minute follow-up",
    description: "Sent if nobody has contacted the lead after 30 minutes.",
  },
  {
    key: "followup_24h",
    label: "24-hour follow-up",
    description: "Sent if nobody has contacted the lead after 24 hours.",
  },
  {
    key: "followup_72h",
    label: "72-hour follow-up",
    description: "Sent if nobody has contacted the lead after 72 hours.",
  },
];

export type LeadAutomationState = "active" | "paused" | "off";

export const LEAD_AUTOMATION_STATE_LABELS: Record<LeadAutomationState, string> =
  {
    active: "Active",
    paused: "Paused for this lead",
    off: "Off for all leads",
  };

/** Automation runs for a lead only when both the global and per-lead switches are on. */
export function getLeadAutomationState(
  settings: Pick<AutomationSettings, "enabled">,
  lead: Pick<Lead, "automation_enabled">,
): LeadAutomationState {
  if (!settings.enabled) return "off";
  return lead.automation_enabled ? "active" : "paused";
}
