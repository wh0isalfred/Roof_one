import { PLACEHOLDER_AUTOMATION_SETTINGS } from "@/lib/placeholder-data";
import type { AutomationSettings } from "./types";

/** Reads the single `automation_settings` row. Placeholder until Supabase is connected. */
export async function getAutomationSettings(): Promise<AutomationSettings> {
  return PLACEHOLDER_AUTOMATION_SETTINGS;
}
