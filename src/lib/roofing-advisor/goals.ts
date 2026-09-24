import { hasContactDetails, hasUsefulLocation } from "./assessment";
import { type MessageAnalysis, preferenceTarget } from "./extraction";
import { estimateFromAssessment, estimateInputFromAssessment } from "./pricing";
import { confidenceOf, isKnown, isResolved } from "./state";
import type {
  AdvisorContext,
  AdvisorGoal,
  AdvisorStage,
  AssessmentField,
  RoofingAssessment,
} from "./types";

/*
 * The goal planner.
 *
 * Instead of a question sequence, every turn ranks the goals that still
 * matter, given the intent, the urgency, what's known, what the homeowner
 * doesn't know, and what's already been asked. The AI chooses among the top
 * goals and phrases the question; the local fallback asks the first one.
 */

export interface GoalCandidate {
  goal: AdvisorGoal;
  /** Why it matters now. Given to the AI as guidance. */
  reason: string;
}

export interface GoalPlan {
  /** Ranked. The first is the recommendation. */
  candidates: GoalCandidate[];
  next: GoalCandidate | null;
  stage: AdvisorStage;
  /** Show the preliminary estimate this turn. */
  showEstimate: boolean;
  estimateReady: boolean;
  handoff: boolean;
  close: boolean;
  /** Contact details are in: hand the assessment to the team. */
  complete: boolean;
}

/** What each goal is for, in words the AI and the team can read. */
export const GOAL_DESCRIPTIONS: Record<AdvisorGoal, string> = {
  identify_issue: "Find out what's going on with the roof.",
  determine_urgency: "Find out whether it's getting worse and how soon they need it handled.",
  locate_leak: "Find out where inside the home the water shows up (which room or area).",
  determine_active_leak: "Find out whether water is getting in now, or only when it rains.",
  determine_start_time: "Find out when it started. For storm damage: when the storm hit.",
  determine_storm_damage: "Find out whether a storm, hail or high wind came through around then.",
  determine_visible_damage: "Find out whether any damage is visible on the roof from outside.",
  determine_exposed_roof: "Find out whether any of the roof is open: holes, bare wood, missing sections.",
  determine_interior_damage: "Find out whether there's damage inside, like stains or wet drywall.",
  determine_replacement_reason: "Find out what makes them think the roof needs replacing.",
  determine_repair_scope: "Find out what needs fixing.",
  determine_inspection_reason: "Find out whether they've noticed something, or want a routine check.",
  request_photo: "Ask for a photo of the damage. Optional: if they can't, move on.",
  determine_roof_age: "Find out roughly how old the roof is.",
  determine_roof_material: "Find out what the roof is made of (asphalt shingles, metal, tile, flat).",
  determine_roof_size: "Find out roughly how big the house is, in square feet.",
  determine_stories: "Find out how many stories the house has.",
  determine_replacement_interest: "Find out whether they lean toward a repair or a full replacement.",
  confirm_detail: "Double-check a detail they changed, because it moves the estimate.",
  offer_estimate: "Offer to work out a rough price range.",
  provide_estimate: "Introduce the rough price range. The app shows the numbers; never state them.",
  determine_contact: "Get their name, so the team knows who to ask for.",
  determine_phone: "Get the best phone number to reach them (or an email, if they'd rather).",
  determine_address: "Get the property address, or at least the ZIP code.",
  determine_contact_preference: "Find out whether a call or a text works better (for inspections: which days or times work).",
  human_handoff: "Connect them with the Roof One team.",
  wrap_up: "Let them know the team has everything.",
  close: "Let them go without persuading them to stay.",
};

export const CONTACT_GOALS: ReadonlySet<AdvisorGoal> = new Set([
  "determine_contact",
  "determine_phone",
  "determine_address",
  "determine_contact_preference",
]);

const CONTROL_GOALS: ReadonlySet<AdvisorGoal> = new Set([
  "confirm_detail",
  "offer_estimate",
  "provide_estimate",
  "human_handoff",
  "wrap_up",
  "close",
]);

export function isQualifyingGoal(goal: AdvisorGoal): boolean {
  return !CONTACT_GOALS.has(goal) && !CONTROL_GOALS.has(goal);
}

/** A goal can be asked twice: once, and again if they changed the subject. */
export const MAX_ASKS = 2;
/** After this many situation questions, move on to the estimate and the team. */
export const MAX_QUALIFYING_QUESTIONS = 7;

type Needed = (a: RoofingAssessment, c: AdvisorContext) => boolean;

interface Rule {
  goal: AdvisorGoal;
  reason: string;
  needed: Needed;
  /** Defaults to MAX_ASKS. */
  maxAsks?: number;
}

const asked = (c: AdvisorContext, goal: AdvisorGoal) => c.asked[goal] ?? 0;
const unknown = (c: AdvisorContext, field: AssessmentField) => c.unknown.includes(field);
const resolved = (a: RoofingAssessment, c: AdvisorContext, field: AssessmentField) =>
  isResolved(a, c, field);
const damageSeen = (a: RoofingAssessment) => (a.visible_damage?.length ?? 0) > 0;

const photosWanted: Needed = (a, c) =>
  a.photos_uploaded !== true && a.photos_available !== false && !unknown(c, "photos_available");

// "Water is coming through" suggests an active leak; it's worth confirming.
const activeLeakNeeded: Needed = (a, c) =>
  !unknown(c, "active_leak") && (a.active_leak === null || confidenceOf(c, "active_leak") < 0.85);

const materialNeeded: Needed = (a, c) =>
  !unknown(c, "roof_material") &&
  (a.roof_material === null || confidenceOf(c, "roof_material") < 0.7);

const sizeNeeded: Needed = (a, c) => !resolved(a, c, "home_size") && !resolved(a, c, "roof_size");

const storiesNeeded: Needed = (a, c) => !resolved(a, c, "stories") && !isKnown(a, "roof_size");

const RULES = {
  locate: { goal: "locate_leak", reason: "Where the water shows up inside.", needed: (a, c) => !hasUsefulLocation(a.leak_location) && !unknown(c, "leak_location") },
  active: { goal: "determine_active_leak", reason: "Whether water is getting in now. That sets the urgency.", needed: activeLeakNeeded },
  start: { goal: "determine_start_time", reason: "When it started.", needed: (a, c) => !resolved(a, c, "issue_started") },
  storm: { goal: "determine_storm_damage", reason: "Whether a storm came through around then.", needed: (a, c) => !resolved(a, c, "storm_damage") },
  visible: { goal: "determine_visible_damage", reason: "Anything visible on the roof from outside.", needed: (a, c) => !resolved(a, c, "visible_damage") },
  interior: { goal: "determine_interior_damage", reason: "Damage inside the home.", needed: (a, c) => !resolved(a, c, "interior_damage") },
  photo: { goal: "request_photo", reason: "A photo helps the team see the damage before a visit.", needed: photosWanted, maxAsks: 1 },
  age: { goal: "determine_roof_age", reason: "The roof's age shapes whether it's a repair or more.", needed: (a, c) => !resolved(a, c, "roof_age") },
  material: { goal: "determine_roof_material", reason: "Material changes the price range.", needed: materialNeeded, maxAsks: 1 },
  size: { goal: "determine_roof_size", reason: "Size drives a replacement range.", needed: sizeNeeded },
  stories: { goal: "determine_stories", reason: "Stories affect access and roof area.", needed: storiesNeeded },
} satisfies Record<string, Rule>;

const LEAK_RULES: readonly Rule[] = [
  RULES.locate,
  RULES.active,
  RULES.start,
  RULES.storm,
  RULES.visible,
  RULES.interior,
  RULES.photo,
  RULES.age,
];

const STORM_RULES: readonly Rule[] = [
  RULES.storm,
  RULES.visible,
  { ...RULES.active, needed: (a, c) => a.active_leak === null && !unknown(c, "active_leak") },
  { ...RULES.locate, needed: (a, c) => a.active_leak === true && !hasUsefulLocation(a.leak_location) && !unknown(c, "leak_location") },
  {
    goal: "determine_exposed_roof",
    reason: "An open roof needs attention fast.",
    needed: (a, c) => !resolved(a, c, "exposed_roof") && (a.missing_shingles === true || damageSeen(a)),
  },
  {
    ...RULES.interior,
    needed: (a, c) => !resolved(a, c, "interior_damage") && !(a.active_leak === true && hasUsefulLocation(a.leak_location)),
  },
  RULES.photo,
  {
    goal: "determine_start_time",
    reason: "When the storm hit.",
    needed: (a, c) => !resolved(a, c, "storm_date") && !resolved(a, c, "issue_started"),
  },
  RULES.age,
];

const replacementReasonKnown = (a: RoofingAssessment) =>
  Boolean(a.current_condition) ||
  (a.roof_age !== null && a.roof_age >= 15) ||
  a.active_leak === true ||
  a.storm_damage === true ||
  damageSeen(a);

const REPLACEMENT_RULES: readonly Rule[] = [
  {
    goal: "determine_replacement_reason",
    reason: "What's prompting the replacement.",
    needed: (a, c) => !replacementReasonKnown(a) && !unknown(c, "current_condition"),
  },
  RULES.age,
  { ...RULES.active, needed: (a, c) => a.active_leak === null && !unknown(c, "active_leak") },
  RULES.material,
  RULES.size,
  RULES.stories,
  RULES.photo,
];

const REPAIR_COMPONENT =
  /\b(?:shingles?|flashing|gutters?|vents?|chimney|fascia|soffits?|skylights?|tiles?|boot|ridge|valley|drip edge|leak\w*)\b/i;

const REPAIR_RULES: readonly Rule[] = [
  {
    goal: "determine_repair_scope",
    reason: "What needs fixing.",
    needed: (a, c) =>
      !damageSeen(a) &&
      !REPAIR_COMPONENT.test(`${a.issue_description ?? ""} ${a.current_condition ?? ""}`) &&
      !unknown(c, "issue_description"),
  },
  RULES.storm,
  { ...RULES.active, needed: (a, c) => a.active_leak === null && !unknown(c, "active_leak") },
  RULES.photo,
  {
    goal: "determine_urgency",
    reason: "Whether it's getting worse.",
    needed: (a, c) => confidenceOf(c, "urgency") === 0 && a.active_leak !== true && !unknown(c, "urgency"),
    maxAsks: 1,
  },
  RULES.age,
];

const INSPECTION_RULES: readonly Rule[] = [
  {
    goal: "determine_inspection_reason",
    reason: "Whether something prompted it, or it's routine.",
    needed: (a, c) =>
      !a.current_condition && !damageSeen(a) && a.interior_damage !== true && !unknown(c, "current_condition"),
  },
];

const PRICING_RULES: readonly Rule[] = [
  {
    goal: "offer_estimate",
    reason: "They asked about price.",
    needed: (_a, c) => !c.estimate.offered && !c.estimate.requested && !c.estimate.shown,
    maxAsks: 1,
  },
  {
    goal: "determine_replacement_reason",
    reason: "What's got them thinking about a new roof.",
    needed: (a, c) => c.estimate.declined && !replacementReasonKnown(a) && !unknown(c, "current_condition"),
  },
];

const IDENTIFY_RULE: Rule = {
  goal: "identify_issue",
  reason: "Nothing specific yet.",
  needed: (a) => a.intent === null || a.intent === "unknown",
};

const ESTIMATE_INPUT_RULES: readonly Rule[] = [RULES.size, RULES.material, RULES.stories];

const CONFIRM_RULE: Rule = {
  goal: "confirm_detail",
  reason: "A detail changed in a way that moves the estimate.",
  needed: (_a, c) => c.pending_confirmation !== null,
  maxAsks: 1,
};

const CONTACT_RULES: readonly Rule[] = [
  {
    goal: "determine_contact",
    reason: "Their name, so the team knows who to ask for.",
    needed: (a, c) => !a.name && !unknown(c, "name"),
  },
  {
    goal: "determine_phone",
    reason: "The best number to reach them.",
    needed: (a, c) => Boolean(a.name) && !a.phone && !a.email && !unknown(c, "phone") && !unknown(c, "email"),
  },
  {
    goal: "determine_address",
    reason: "Where the property is.",
    needed: (a, c) => !c.callback_requested && !a.address && !a.zip_code && !unknown(c, "address"),
  },
  {
    goal: "determine_contact_preference",
    reason: "How and when to reach them.",
    maxAsks: 1,
    needed: (a, c) => {
      // In an emergency or a callback, the team just calls.
      if (c.callback_requested || c.emergency || a.urgency === "emergency") return false;
      const field = preferenceTarget(a);
      if (field === "preferred_time") return !a.preferred_time && !unknown(c, "preferred_time");
      return Boolean(a.phone) && !a.preferred_contact_method && !unknown(c, "preferred_contact_method");
    },
  },
];

function rulesForIntent(a: RoofingAssessment): readonly Rule[] {
  switch (a.intent) {
    case "leak":
      return LEAK_RULES;
    case "storm_damage":
      return STORM_RULES;
    case "replacement":
      return REPLACEMENT_RULES;
    case "repair":
      return REPAIR_RULES;
    case "inspection":
    case "other":
      return INSPECTION_RULES;
    case "pricing":
      return PRICING_RULES;
    default:
      return [];
  }
}

function open(rules: readonly Rule[], a: RoofingAssessment, c: AdvisorContext): Rule[] {
  return rules.filter((rule) => rule.needed(a, c) && asked(c, rule.goal) < (rule.maxAsks ?? MAX_ASKS));
}

function isReplacementPricing(a: RoofingAssessment, c: AdvisorContext): boolean {
  return estimateInputFromAssessment(a, c.estimate.focus)?.intent === "replacement";
}

/** Whether the estimate engine has enough to give a useful range. */
export function isEstimateReady(a: RoofingAssessment, c: AdvisorContext): boolean {
  if (!estimateFromAssessment(a, c.estimate.focus)) return false;
  if (!isReplacementPricing(a, c)) return true;
  return ESTIMATE_INPUT_RULES.every(
    (rule) => !rule.needed(a, c) || asked(c, rule.goal) >= (rule.maxAsks ?? MAX_ASKS),
  );
}

export interface PlanInput {
  assessment: RoofingAssessment;
  context: AdvisorContext;
  analysis: MessageAnalysis | null;
}

export function planGoals({ assessment: a, context: c, analysis }: PlanInput): GoalPlan {
  const signals = analysis?.signals;
  const plan = (partial: Partial<GoalPlan> & Pick<GoalPlan, "candidates">): GoalPlan => {
    const next = partial.candidates[0] ?? null;
    const result: GoalPlan = {
      next,
      stage: "qualifying",
      showEstimate: false,
      estimateReady: isEstimateReady(a, c),
      handoff: false,
      close: false,
      complete: false,
      ...partial,
    };
    result.stage = partial.stage ?? deriveStage(a, c, result);
    return result;
  };
  const candidate = (rule: Rule): GoalCandidate => ({ goal: rule.goal, reason: rule.reason });

  if (c.closed) {
    return plan({ candidates: [{ goal: "close", reason: "They want to stop." }], close: true, stage: "closed" });
  }
  if (signals?.humanRequest && !c.callback_requested) {
    return plan({
      candidates: [{ goal: "human_handoff", reason: "They asked for a person." }],
      handoff: true,
      stage: "human_handoff",
    });
  }

  const candidates: GoalCandidate[] = [];
  const push = (rule: Rule) => {
    if (!candidates.some((existing) => existing.goal === rule.goal)) candidates.push(candidate(rule));
  };

  const contactRules = c.contact_declined ? [] : open(CONTACT_RULES, a, c);
  const contactDone = hasContactDetails(a) && contactRules.length === 0;
  if (contactDone && !c.completed) {
    return plan({
      candidates: [{ goal: "wrap_up", reason: "The team has what it needs." }],
      complete: true,
      stage: "complete",
    });
  }
  if (c.completed) return plan({ candidates: [], stage: "complete" });
  if (c.contact_declined && !hasContactDetails(a)) {
    return plan({ candidates: [{ goal: "wrap_up", reason: "They'd rather not share contact details." }], stage: "closed" });
  }

  if (c.pending_confirmation) open([CONFIRM_RULE], a, c).forEach(push);

  const priceable = estimateFromAssessment(a, c.estimate.focus) !== null;
  const ready = isEstimateReady(a, c);
  const qualifyingAsked = Object.entries(c.asked).reduce(
    (total, [goal, count]) => total + (isQualifyingGoal(goal as AdvisorGoal) ? (count ?? 0) : 0),
    0,
  );
  const fatigued = qualifyingAsked >= MAX_QUALIFYING_QUESTIONS;
  const intentRules = open(rulesForIntent(a), a, c);
  const identify = open([IDENTIFY_RULE], a, c);
  const inputs = isReplacementPricing(a, c) ? open(ESTIMATE_INPUT_RULES, a, c) : [];
  let showEstimate = false;

  // They asked about price: offer a range, or give it if they already said yes.
  const offerNow =
    priceable &&
    signals?.pricingQuestion === true &&
    !c.estimate.offered &&
    !c.estimate.shown &&
    !c.estimate.requested;
  if (offerNow) push({ goal: "offer_estimate", reason: "They asked about price.", needed: () => true });

  if (c.estimate.requested && priceable) {
    if (inputs.length > 0 && !fatigued) inputs.forEach(push);
    else showEstimate = true;
  }

  const contactStarted = (c.asked.determine_contact ?? 0) > 0 || (c.asked.determine_phone ?? 0) > 0;
  if (c.callback_requested) {
    contactRules.forEach(push);
  } else if (c.emergency || a.urgency === "emergency") {
    // One essential question at most, then get the team involved.
    const locate = intentRules.find((rule) => rule.goal === "locate_leak");
    if (locate && !contactStarted) push(locate);
    contactRules.forEach(push);
  } else if (contactStarted) {
    contactRules.forEach(push);
  } else {
    if (!fatigued) {
      identify.forEach(push);
      intentRules.forEach(push);
    }
    const situationDone = !candidates.some((entry) => isQualifyingGoal(entry.goal) || entry.goal === "offer_estimate");
    const intentKnown = a.intent !== null && a.intent !== "unknown";
    if ((situationDone && (intentKnown || fatigued || identify.length === 0)) || signals?.wantsVisit) {
      if (priceable && ready && !c.estimate.shown && !c.estimate.declined) showEstimate = true;
      contactRules.forEach(push);
    }
  }

  return plan({ candidates, showEstimate: showEstimate && ready });
}

/** The conversation's purpose right now, given the plan for this turn. */
export function stageFor(a: RoofingAssessment, c: AdvisorContext, plan: GoalPlan): AdvisorStage {
  return deriveStage(a, c, plan);
}

function deriveStage(a: RoofingAssessment, c: AdvisorContext, plan: GoalPlan): AdvisorStage {
  if (plan.close) return "closed";
  if (plan.handoff) return "human_handoff";
  if (plan.complete || c.completed) return "complete";
  const goal = plan.next?.goal;
  if (goal && CONTACT_GOALS.has(goal)) return "contact";
  if (
    plan.showEstimate ||
    goal === "offer_estimate" ||
    goal === "provide_estimate" ||
    goal === "confirm_detail" ||
    (c.estimate.requested && goal !== undefined && ESTIMATE_INPUT_RULES.some((rule) => rule.goal === goal))
  ) {
    return "estimating";
  }
  if (a.intent !== null && a.intent !== "unknown") return "qualifying";
  return c.turn > 0 ? "understanding" : "greeting";
}
