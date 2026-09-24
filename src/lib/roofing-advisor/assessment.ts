import type { FieldUpdate, MessageAnalysis } from "./extraction";
import {
  AREA_PATTERN,
  DERIVED_INTERIOR_PREFIX,
  FEATURE_PATTERN,
  ROOM_PATTERN,
  SURFACE_PATTERN,
} from "./extraction";
import type { IntentDetection } from "./intents";
import { estimateFromAssessment } from "./pricing";
import { higherUrgency, isKnown } from "./state";
import type {
  AdvisorContext,
  AdvisorIntent,
  AdvisorUrgency,
  AssessmentField,
  EstimateFocus,
  PendingConfirmation,
  RoofingAssessment,
} from "./types";

/*
 * Assessment state: merging what the homeowner says into one consistent
 * picture. The latest explicit statement wins, a hedged guess never
 * overwrites a confident answer, and a change that would move the estimate
 * is flagged for a quick "just to check".
 */

export interface AdvisorState {
  assessment: RoofingAssessment;
  context: AdvisorContext;
}

export function cloneState(state: AdvisorState): AdvisorState {
  return structuredClone(state);
}

function writeField(
  assessment: RoofingAssessment,
  field: AssessmentField,
  value: RoofingAssessment[AssessmentField],
): void {
  (assessment as Record<AssessmentField, unknown>)[field] = value;
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---------------------------------------------------------------------------
// Field-specific merges
// ---------------------------------------------------------------------------

function hasPlace(location: string): boolean {
  return ROOM_PATTERN.test(location) || AREA_PATTERN.test(location);
}

function surfaceOf(location: string): string | null {
  return SURFACE_PATTERN.exec(location)?.[0] ?? null;
}

/** Whether a location says where in the house, not just "ceiling". */
export function hasUsefulLocation(location: string | null): boolean {
  if (!location) return false;
  return hasPlace(location) || FEATURE_PATTERN.test(location) || !SURFACE_PATTERN.test(location);
}

/**
 * "ceiling" then "bedroom" is the bedroom ceiling. "bedroom" then "guest
 * bedroom" is a correction, not a second location.
 */
export function mergeLocation(current: string | null, incoming: string): string {
  if (!current) return incoming;
  const incomingSurface = surfaceOf(incoming);
  const currentSurface = surfaceOf(current);
  if (hasPlace(incoming) && !incomingSurface && currentSurface) {
    return `${incoming.replace(/,.*$/, "")} ${currentSurface}`;
  }
  if (incomingSurface && !hasPlace(incoming) && hasPlace(current) && !currentSurface) {
    return `${current} ${incoming}`;
  }
  return incoming;
}

const PLACEHOLDER_DAMAGE = "visible damage reported";

function mergeDamage(current: string[] | null, incoming: string[]): string[] | null {
  if (incoming.length === 0) return current === null ? [] : current;
  const base = (current ?? []).filter((item) => item !== PLACEHOLDER_DAMAGE || incoming.includes(item));
  const next = [...base];
  for (const item of incoming) {
    if (item === PLACEHOLDER_DAMAGE && base.length > 0) continue;
    if (!next.includes(item)) next.push(item);
  }
  return next;
}

function appendNote(current: string | null, note: string): string {
  if (!current) return note;
  return current.includes(note) ? current : `${current} ${note}`;
}

// ---------------------------------------------------------------------------
// Intent and urgency
// ---------------------------------------------------------------------------

const GENERIC_INTENTS: ReadonlySet<AdvisorIntent> = new Set(["unknown", "other", "pricing"]);

/**
 * Keeps the conversation on its primary intent unless something more
 * specific or more direct comes along.
 */
export function resolveIntent(
  current: AdvisorIntent | null,
  detected: IntentDetection | null,
): AdvisorIntent | null {
  if (!detected) return current;
  if (current === null || current === detected.value) return detected.value;
  if (GENERIC_INTENTS.has(current)) {
    return detected.value === "pricing" || detected.value === "unknown" ? current : detected.value;
  }
  if (detected.value === "pricing" || detected.value === "unknown") return current;
  // A direct request changes course: "Actually, I just want an inspection."
  if (detected.explicit && (detected.value === "replacement" || detected.value === "inspection") && detected.confidence >= 0.85) {
    return current === "leak" || current === "storm_damage" ? current : detected.value;
  }
  // Symptoms are more specific than a general request. A storm behind a
  // repair is the repair's cause, not a new conversation.
  if (current === "inspection" && (detected.value === "leak" || detected.value === "storm_damage")) {
    return detected.value;
  }
  if (current === "repair" && detected.value === "leak") return detected.value;
  return current;
}

function isRecent(when: string | null): boolean {
  if (!when) return false;
  return /\b(?:today|tonight|yesterday|last night|this (?:morning|afternoon|evening|week|weekend)|last (?:week|weekend|night)|other day|days? ago|a week ago|weekend|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(when);
}

export function deriveUrgency(state: AdvisorState, stated: AdvisorUrgency | null): AdvisorUrgency | null {
  const { assessment: a, context: c } = state;
  let derived: AdvisorUrgency | null = null;
  const tarped = a.notes?.includes("tarp") ?? false;

  if (c.emergency || (a.exposed_roof === true && !tarped)) {
    derived = "emergency";
  } else if (
    a.active_leak === true ||
    a.exposed_roof === true ||
    (a.storm_damage === true && (a.missing_shingles === true || (a.visible_damage?.length ?? 0) > 0) && isRecent(a.storm_date ?? a.issue_started))
  ) {
    derived = "high";
  } else if (a.intent === "leak" || a.intent === "storm_damage" || a.intent === "repair") {
    derived = "normal";
  } else if (a.intent === "replacement" || a.intent === "inspection" || a.intent === "pricing") {
    derived = "low";
  }

  if (stated === "low") return derived === "high" || derived === "emergency" ? derived : "low";
  return higherUrgency(derived, stated);
}

// ---------------------------------------------------------------------------
// Conflicts that would change the estimate
// ---------------------------------------------------------------------------

const PRICING_FIELDS: ReadonlySet<PendingConfirmation["field"]> = new Set([
  "roof_age",
  "roof_material",
  "home_size",
  "roof_size",
  "stories",
]);

function isPricingField(field: AssessmentField): field is PendingConfirmation["field"] {
  return PRICING_FIELDS.has(field as PendingConfirmation["field"]);
}

function estimateMoves(
  assessment: RoofingAssessment,
  focus: EstimateFocus | null,
  field: PendingConfirmation["field"],
  previous: unknown,
  latest: unknown,
): boolean {
  const before = { ...assessment, [field]: previous } as RoofingAssessment;
  const after = { ...assessment, [field]: latest } as RoofingAssessment;
  const a = estimateFromAssessment(before, focus);
  const b = estimateFromAssessment(after, focus);
  if (!a || !b) return false;
  return a.low !== b.low || a.high !== b.high;
}

// ---------------------------------------------------------------------------
// Applying a message
// ---------------------------------------------------------------------------

export interface AppliedAnalysis {
  state: AdvisorState;
  changed: AssessmentField[];
}

/** Merges one message's extracted facts into the state. Pure: returns a new state. */
export function applyAnalysis(previous: AdvisorState, analysis: MessageAnalysis): AppliedAnalysis {
  const state = cloneState(previous);
  const { assessment, context } = state;
  const changed = new Set<AssessmentField>();
  const correction = analysis.signals.correction;

  // Answering "just to check — about 10 or 15 years?"
  const pending = context.pending_confirmation;
  if (pending && analysis.confirmation !== null) {
    writeField(assessment, pending.field, analysis.confirmation as RoofingAssessment[typeof pending.field]);
    context.confidence[pending.field] = 0.95;
    context.pending_confirmation = null;
    changed.add(pending.field);
  } else if (pending && (context.asked.confirm_detail ?? 0) > 0) {
    // They moved on; the latest value stands.
    context.pending_confirmation = null;
  }

  for (const update of analysis.updates) {
    if (pending && update.field === pending.field && analysis.confirmation !== null) continue;
    if (applyUpdate(state, update, correction)) changed.add(update.field);
  }

  // A corrected location carries into the description derived from it.
  if (
    changed.has("leak_location") &&
    assessment.leak_location &&
    assessment.interior_damage_description?.startsWith(DERIVED_INTERIOR_PREFIX)
  ) {
    assessment.interior_damage_description = `${DERIVED_INTERIOR_PREFIX}${assessment.leak_location}`;
  }

  // Intent.
  const intent = resolveIntent(assessment.intent, analysis.intent);
  if (intent !== assessment.intent) {
    assessment.intent = intent;
    changed.add("intent");
  }
  if (analysis.intent && intent === analysis.intent.value) {
    context.confidence.intent = Math.max(context.confidence.intent ?? 0, analysis.intent.confidence);
  }
  if (intent === "storm_damage" && assessment.storm_damage === null) {
    assessment.storm_damage = true;
    context.confidence.storm_damage = 0.9;
    changed.add("storm_damage");
  }
  if (intent === "replacement" && assessment.replacement_interest === null) {
    assessment.replacement_interest = true;
    changed.add("replacement_interest");
  }
  if (intent === "inspection" && assessment.inspection_interest === null) {
    assessment.inspection_interest = true;
    changed.add("inspection_interest");
  }
  if (intent === "repair" && assessment.repair_interest === null) {
    assessment.repair_interest = true;
    changed.add("repair_interest");
  }

  // What they don't know stays out of the question list.
  for (const field of analysis.unknownFields) {
    if (!isKnown(assessment, field) && !context.unknown.includes(field)) {
      context.unknown.push(field);
      changed.add(field);
    }
  }
  context.unknown = context.unknown.filter((field) => !isKnown(assessment, field));

  // Safety and urgency.
  if (analysis.signals.emergency || analysis.signals.electricalHazard) context.emergency = true;
  if (analysis.signals.statedUrgency) {
    context.stated_urgency = analysis.signals.statedUrgency;
    context.confidence.urgency = 0.8;
  }
  const urgency = deriveUrgency(state, context.stated_urgency);
  if (urgency !== assessment.urgency) {
    assessment.urgency = urgency;
    changed.add("urgency");
  }

  context.recent_fields = [...changed];
  return { state, changed: [...changed] };
}

function applyUpdate(state: AdvisorState, update: FieldUpdate, correction: boolean): boolean {
  const { assessment, context } = state;
  const { field } = update;
  const current = assessment[field];
  const currentConfidence = context.confidence[field] ?? (current === null ? 0 : 0.8);

  // A weak inference never overwrites something the homeowner said plainly.
  if (
    current !== null &&
    !update.contextual &&
    !correction &&
    update.confidence < 0.65 &&
    currentConfidence >= update.confidence
  ) {
    return false;
  }

  let value: unknown = update.value;
  switch (field) {
    case "leak_location":
      value = mergeLocation(assessment.leak_location, update.value as string);
      break;
    case "visible_damage":
      value = mergeDamage(assessment.visible_damage, update.value as string[]);
      break;
    case "notes":
      value = appendNote(assessment.notes, update.value as string);
      break;
    case "issue_description":
      if (current !== null && !update.contextual) return false;
      break;
    case "urgency":
      // Urgency is derived after all updates; a stated urgency feeds into it.
      return false;
    default:
      break;
  }

  if (sameValue(current, value)) {
    context.confidence[field] = Math.max(currentConfidence, update.confidence);
    return false;
  }

  if (current !== null && isPricingField(field) && !context.pending_confirmation) {
    const hedgedOrUnframed = !correction || update.confidence < 0.75;
    if (hedgedOrUnframed && estimateMoves(assessment, context.estimate.focus, field, current, value)) {
      context.pending_confirmation = {
        field,
        previous: current as string | number,
        latest: value as string | number,
      };
    }
  }

  writeField(assessment, field, value as RoofingAssessment[AssessmentField]);
  context.confidence[field] = update.confidence;
  return true;
}

/**
 * Applies structured updates proposed by the AI provider. Values were
 * already validated for shape; this only merges them.
 */
export function applyProviderUpdates(
  previous: AdvisorState,
  updates: Partial<RoofingAssessment>,
  confidence: Record<string, number>,
): AppliedAnalysis {
  const state = cloneState(previous);
  const changed = new Set<AssessmentField>();
  for (const [key, value] of Object.entries(updates) as Array<[AssessmentField, RoofingAssessment[AssessmentField]]>) {
    if (key === "intent" || key === "urgency") continue;
    const update = {
      field: key,
      value,
      confidence: confidence[key] ?? 0.8,
      contextual: true,
    } as FieldUpdate;
    if (value === null) {
      // The AI corrected a misread value.
      if (state.assessment[key] !== null) {
        writeField(state.assessment, key, null);
        delete state.context.confidence[key];
        changed.add(key);
      }
      continue;
    }
    if (applyUpdate(state, update, true)) changed.add(key);
  }
  state.context.unknown = state.context.unknown.filter((field) => !isKnown(state.assessment, field));
  state.context.recent_fields = [...new Set([...state.context.recent_fields, ...changed])];
  return { state, changed: [...changed] };
}

/** Internal lead quality. Never shown to the homeowner. */
export function assessmentCompleteness(assessment: RoofingAssessment, estimateReady: boolean) {
  return {
    contact: Boolean(assessment.name && (assessment.phone || assessment.email)),
    issue: assessment.intent !== null && assessment.intent !== "unknown",
    urgency: assessment.urgency !== null,
    location: Boolean(assessment.leak_location || assessment.address || assessment.zip_code),
    damage: (assessment.visible_damage?.length ?? 0) > 0 || assessment.interior_damage !== null,
    photos: assessment.photos_uploaded === true,
    estimate_ready: estimateReady,
  };
}

export function hasContactDetails(assessment: RoofingAssessment): boolean {
  return Boolean(assessment.name && (assessment.phone || assessment.email));
}

/** The diff between two assessments, for the AI response contract. */
export function diffAssessment(before: RoofingAssessment, after: RoofingAssessment): Partial<RoofingAssessment> {
  const diff: Partial<RoofingAssessment> = {};
  for (const field of Object.keys(after) as AssessmentField[]) {
    if (!sameValue(before[field], after[field])) {
      (diff as Record<AssessmentField, unknown>)[field] = after[field];
    }
  }
  return diff;
}
