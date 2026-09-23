/**
 * `public.automation_settings`: the global switches. The table holds exactly
 * one row. Per-lead control is `leads.automation_enabled`.
 */
export interface AutomationSettings {
  id: number;
  /** Master switch. When off, nothing is sent automatically to anyone. */
  enabled: boolean;
  confirmation_email: boolean;
  confirmation_sms: boolean;
  missed_call_followup: boolean;
  followup_30m: boolean;
  followup_24h: boolean;
  followup_72h: boolean;
}

export type AutomationActionKey = Exclude<
  keyof AutomationSettings,
  "id" | "enabled"
>;
