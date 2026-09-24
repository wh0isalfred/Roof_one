import type {
  AdvisorContext,
  AdvisorUrgency,
  AssessmentField,
  RoofingAssessment,
} from "./types";

/** A blank assessment: nothing is known yet. */
export function createAssessment(): RoofingAssessment {
  return {
    intent: null,
    urgency: null,
    issue_description: null,
    active_leak: null,
    leak_location: null,
    leak_frequency: null,
    issue_started: null,
    storm_damage: null,
    storm_date: null,
    visible_damage: null,
    missing_shingles: null,
    damaged_shingles: null,
    exposed_roof: null,
    interior_damage: null,
    interior_damage_description: null,
    roof_age: null,
    roof_material: null,
    roof_size: null,
    home_size: null,
    stories: null,
    current_condition: null,
    replacement_interest: null,
    repair_interest: null,
    inspection_interest: null,
    photos_available: null,
    photos_uploaded: null,
    address: null,
    city: null,
    state: null,
    zip_code: null,
    name: null,
    phone: null,
    email: null,
    preferred_contact_method: null,
    preferred_time: null,
    notes: null,
  };
}

/** Every conversation opens with the greeting, which asks what's going on. */
export function createContext(): AdvisorContext {
  return {
    stage: "greeting",
    turn: 0,
    confidence: {},
    unknown: [],
    asked: { identify_issue: 1 },
    last_goal: "identify_issue",
    recent_fields: [],
    pending_confirmation: null,
    estimate: { offered: false, requested: false, declined: false, shown: false, focus: null },
    handoff_requested: false,
    callback_requested: false,
    emergency: false,
    stated_urgency: null,
    team_questions: [],
    contact_declined: false,
    completed: false,
    closed: false,
  };
}

export function isKnown(assessment: RoofingAssessment, field: AssessmentField): boolean {
  const value = assessment[field];
  if (value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
}

export function isUnknownToHomeowner(
  context: AdvisorContext,
  field: AssessmentField,
): boolean {
  return context.unknown.includes(field);
}

/** Known, or the homeowner said they don't know: either way, don't ask. */
export function isResolved(
  assessment: RoofingAssessment,
  context: AdvisorContext,
  field: AssessmentField,
): boolean {
  return isKnown(assessment, field) || isUnknownToHomeowner(context, field);
}

export function confidenceOf(
  context: AdvisorContext,
  field: AssessmentField | "intent",
): number {
  return context.confidence[field] ?? 0;
}

const URGENCY_RANK: Record<AdvisorUrgency, number> = {
  low: 0,
  normal: 1,
  high: 2,
  emergency: 3,
};

export function higherUrgency(
  a: AdvisorUrgency | null,
  b: AdvisorUrgency | null,
): AdvisorUrgency | null {
  if (a === null) return b;
  if (b === null) return a;
  return URGENCY_RANK[a] >= URGENCY_RANK[b] ? a : b;
}

export function firstName(name: string | null): string | null {
  const first = name?.trim().split(/\s+/)[0];
  return first ? first : null;
}
