import type {
  ContactMethod,
  IssueType,
  RoofAge,
  RoofType,
  TimeWindow,
  Urgency,
} from "@/lib/leads/options";
import type { NewLead } from "@/lib/leads/types";
import { hasContactDetails } from "./assessment";
import { formatMoney, materialKey } from "./pricing";
import { policyLabel } from "./phrasing";
import type {
  AdvisorContext,
  AdvisorIntent,
  AdvisorUrgency,
  EstimateResult,
  RoofingAssessment,
} from "./types";

/*
 * Turning an advisor conversation into a lead row. The mapping is
 * deterministic: the AI never writes to the leads table.
 */

function issueType(a: RoofingAssessment): IssueType {
  const intent: AdvisorIntent | null = a.intent;
  switch (intent) {
    case "leak":
    case "storm_damage":
    case "repair":
    case "replacement":
    case "inspection":
      return intent;
    case "pricing":
      if (a.replacement_interest) return "replacement";
      if (a.repair_interest) return "repair";
      return "not_sure";
    default:
      return "not_sure";
  }
}

function urgency(value: AdvisorUrgency | null): Urgency | null {
  switch (value) {
    case "emergency":
      return "emergency";
    case "high":
    case "normal":
      return "soon";
    case "low":
      return "planning";
    default:
      return null;
  }
}

export function roofAgeRange(age: number | null): RoofAge | null {
  if (age === null) return null;
  if (age < 5) return "under_5";
  if (age < 10) return "5_to_10";
  if (age <= 20) return "10_to_20";
  return "over_20";
}

function roofType(material: string | null): RoofType | null {
  if (!material) return null;
  switch (materialKey(material)) {
    case "asphalt":
      return "asphalt_shingle";
    case "metal":
      return "metal";
    case "tile":
      return "tile";
    case "flat":
      return "flat";
    case null:
      return "unknown";
    default:
      return "other";
  }
}

function timeWindow(value: string | null): TimeWindow | null {
  if (!value) return null;
  const text = value.toLowerCase();
  if (/morning|before noon|before \d/.test(text)) return "morning";
  if (/afternoon|lunch|noon/.test(text)) return "afternoon";
  if (/evening|night|after (?:\d|work)/.test(text)) return "evening";
  if (/any/.test(text)) return "anytime";
  return null;
}

function contactMethod(value: RoofingAssessment["preferred_contact_method"]): ContactMethod | null {
  return value;
}

const sentence = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const capped = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(capped) ? capped : `${capped}.`;
};

/** A plain summary of the assessment for the team, stored as the lead description. */
export function describeAssessment(
  a: RoofingAssessment,
  context: AdvisorContext,
  estimate: EstimateResult | null,
): string {
  const lines: string[] = [];
  if (a.issue_description) lines.push(sentence(a.issue_description));
  if (a.leak_location) lines.push(sentence(`Water shows up at the ${a.leak_location}`));
  if (a.active_leak !== null) {
    lines.push(sentence(a.active_leak ? `Actively leaking${a.leak_frequency ? ` (${a.leak_frequency})` : ""}` : "Not leaking right now"));
  }
  if (a.issue_started) lines.push(sentence(`Started ${a.issue_started}`));
  if (a.storm_damage) lines.push(sentence(`Storm related${a.storm_date ? ` (${a.storm_date})` : ""}`));
  if (a.visible_damage && a.visible_damage.length > 0) lines.push(sentence(`Visible damage: ${a.visible_damage.join(", ")}`));
  if (a.visible_damage && a.visible_damage.length === 0) lines.push("No visible damage from outside.");
  if (a.exposed_roof) lines.push("Part of the roof may be open or exposed.");
  if (a.interior_damage_description) lines.push(sentence(`Inside: ${a.interior_damage_description}`));
  if (a.current_condition) lines.push(sentence(a.current_condition));
  const roof = [
    a.roof_age !== null ? `about ${a.roof_age} years old` : null,
    a.roof_material,
    a.home_size ? `${a.home_size} home` : null,
    a.roof_size ? `${a.roof_size} roof` : null,
    a.stories !== null ? `${a.stories} ${a.stories === 1 ? "story" : "stories"}` : null,
  ].filter(Boolean);
  if (roof.length > 0) lines.push(sentence(`Roof: ${roof.join(", ")}`));
  if (a.photos_uploaded) lines.push("Photos uploaded in the chat.");
  if (estimate) {
    lines.push(
      sentence(
        `Preliminary range shown: ${formatMoney(estimate.low, estimate.currency)}–${formatMoney(estimate.high, estimate.currency)} (${estimate.confidence} confidence)`,
      ),
    );
  }
  if (context.callback_requested) lines.push("Asked for a callback.");
  if (context.team_questions.length > 0) {
    lines.push(sentence(`Questions for the team: ${context.team_questions.map(policyLabel).join(", ")}`));
  }
  if (a.notes) lines.push(sentence(a.notes));
  return lines.join(" ").slice(0, 2000);
}

/** The lead row for this conversation, once there's someone to contact. */
export function toNewLead(
  a: RoofingAssessment,
  context: AdvisorContext,
  estimate: EstimateResult | null,
): NewLead | null {
  if (!hasContactDetails(a) || !a.name) return null;
  return {
    name: a.name,
    email: a.email,
    phone: a.phone,
    address: a.address,
    city: a.city,
    state: a.state,
    zip_code: a.zip_code,
    issue_type: issueType(a),
    roof_age: roofAgeRange(a.roof_age),
    roof_type: roofType(a.roof_material),
    urgency: urgency(a.urgency),
    description: describeAssessment(a, context, estimate),
    preferred_contact_method: contactMethod(a.preferred_contact_method ?? (context.callback_requested ? "phone" : null)),
    preferred_time: timeWindow(a.preferred_time),
  };
}
