import type { AdvisorBusinessConfig } from "@/config/advisor";
import { OPENING_SUGGESTIONS, pick, stableHash } from "./opening";
import type { MessageAnalysis } from "./extraction";
import { contactTarget, preferenceTarget } from "./extraction";
import { CONTACT_GOALS, type GoalPlan } from "./goals";
import { firstName } from "./state";
import type {
  AdvisorContext,
  AdvisorGoal,
  AssessmentField,
  PolicyTopic,
  RoofingAssessment,
} from "./types";

/*
 * Wording for the local (no-AI) advisor.
 *
 * Phrases are keyed by goal, never by stage, and each goal has several
 * natural variants picked with a per-conversation seed. With an AI provider
 * configured, the AI writes the wording and this module is the fallback.
 */

/** Like pick(), but never repeats a phrase from the previous reply. */
function pickFresh(options: readonly string[], seed: string, previous: string | null): string {
  const fresh = previous ? options.filter((option) => !previous.includes(option)) : options;
  return pick(fresh.length > 0 ? fresh : options, seed);
}

export { GREETINGS, greetingFor, OPENING_SUGGESTIONS } from "./opening";

export interface PhraseInput {
  seed: string;
  assessment: RoofingAssessment;
  previous: RoofingAssessment;
  context: AdvisorContext;
  /** Context before this message, to tell what's new. */
  previousContext: AdvisorContext;
  analysis: MessageAnalysis;
  plan: GoalPlan;
  changed: readonly AssessmentField[];
  lastAdvisorReply: string | null;
  business: AdvisorBusinessConfig;
}

export interface Phrased {
  reply: string;
  suggestions: string[];
}

interface Question {
  text: string;
  suggestions?: readonly string[];
}

const POLICY_LABELS: Record<PolicyTopic, string> = {
  insurance: "insurance",
  financing: "financing",
  service_area: "your area",
  availability: "timing",
  hours: "hours",
  warranty: "warranties",
  licensing: "licensing",
  experience: "the company's background",
  inspection_fee: "inspection costs",
};

export function policyLabel(topic: PolicyTopic): string {
  return POLICY_LABELS[topic];
}

function listJoin(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function surfaceIn(location: string | null): string | null {
  return /\b(ceiling|wall|floor)\b/.exec(location ?? "")?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// Questions, by goal
// ---------------------------------------------------------------------------

function questionFor(goal: AdvisorGoal, input: PhraseInput): Question | null {
  const { assessment: a, context: c, analysis, seed } = input;
  const askedBefore = (c.asked[goal] ?? 0) > 0 && input.previousContext.last_goal === goal;
  // A question asked again right away gets different wording.
  const s = `${seed}:${goal}:${askedBefore ? "again" : "first"}`;
  const intent = a.intent;
  const first = firstName(a.name);
  const choose = (options: readonly string[]) => pickFresh(options, s, input.lastAdvisorReply);

  switch (goal) {
    case "identify_issue":
      if (intent === "unknown") {
        return {
          text: choose(["No worries. What have you noticed?", "No worries. What have you noticed so far?"]),
          suggestions: ["A stain on the ceiling", "Missing shingles", "Water dripping", "Something else"],
        };
      }
      return {
        text: choose(["What's going on with the roof?", "What's happening with your roof?", "What are you noticing with the roof?"]),
        suggestions: OPENING_SUGGESTIONS,
      };

    case "locate_leak":
      if (a.leak_location && surfaceIn(a.leak_location)) {
        return { text: choose(["Which room is that in?", "What room is it in?", "Which part of the house is that?"]), suggestions: ["Bedroom", "Living room", "Kitchen", "Attic"] };
      }
      if (intent === "storm_damage") {
        return { text: choose(["Where's the water coming in?", "Where inside is it showing up?"]), suggestions: ["Ceiling", "Wall", "Around a window", "Somewhere else"] };
      }
      return {
        text: choose(["Where's the water coming through?", "Where are you seeing the water?", "Where's it showing up inside?"]),
        suggestions: ["Ceiling", "Wall", "Around a window", "Somewhere else"],
      };

    case "determine_active_leak":
      if (intent === "leak") {
        return { text: choose(["Is it still leaking?", "Still leaking?", "Is it leaking right now?"]), suggestions: ["Yes, right now", "Only when it rains", "Not anymore"] };
      }
      if (intent === "storm_damage") {
        return { text: choose(["Any water getting inside?", "Is any water getting in?"]), suggestions: ["Yes", "No", "Not sure"] };
      }
      return { text: choose(["Any active leaks?", "Any leaks inside right now?"]), suggestions: ["Yes", "No", "Not sure"] };

    case "determine_start_time":
      if (intent === "storm_damage") {
        return { text: choose(["When was the storm?", "When did the storm come through?"]), suggestions: ["Yesterday", "In the last week", "A few weeks ago"] };
      }
      return {
        text: choose(["When did you first notice it?", "When did it start?", "How long has it been going on?"]),
        suggestions: ["Today", "In the last week", "A few weeks ago", "Not sure"],
      };

    case "determine_storm_damage":
      if (intent === "repair") {
        return { text: choose(["Was it from a storm, or more wear and tear?", "Any storm behind it, or just age?"]), suggestions: ["A storm", "Wear and tear", "Not sure"] };
      }
      if (a.issue_started) {
        return { text: choose(["Any storms around then?", "Was there a storm around that time?", "Any bad weather around then?"]), suggestions: ["Yes", "No", "Not sure"] };
      }
      return { text: choose(["Any recent storms or high winds?", "Has there been a storm lately?"]), suggestions: ["Yes", "No", "Not sure"] };

    case "determine_visible_damage":
      if (intent === "storm_damage") {
        return { text: choose(["What can you see from the ground?", "What does it look like from outside?", "Any visible damage outside?"]), suggestions: ["Missing shingles", "Dents or cracks", "Nothing I can see", "Haven't looked"] };
      }
      return {
        text: choose(["Any visible damage outside?", "Can you see any damage on the roof from outside?", "Anything look off from outside?"]),
        suggestions: ["Missing shingles", "Nothing I can see", "Haven't checked"],
      };

    case "determine_exposed_roof":
      return { text: choose(["Is any of the roof open, or can you see bare wood?", "Can you see any holes or bare wood up there?"]), suggestions: ["Yes", "No", "Not sure"] };

    case "determine_interior_damage":
      return { text: choose(["Any damage inside, like stains or wet drywall?", "Anything showing inside, like stains or soft spots?"]), suggestions: ["Yes, some stains", "No", "Not sure"] };

    case "determine_replacement_reason":
      if (intent === "pricing") {
        return { text: "What's got you thinking about a new roof?", suggestions: ["It's getting old", "It keeps leaking", "Storm damage", "Just planning ahead"] };
      }
      return {
        text: choose(["What makes you think it needs replacing?", "What's got you thinking about a new roof?", "What's prompting the replacement?"]),
        suggestions: ["It's getting old", "It keeps leaking", "Storm damage", "Selling the house"],
      };

    case "determine_repair_scope":
      return { text: choose(["What needs fixing?", "What's damaged?", "What needs repairing?"]), suggestions: ["A few shingles", "Flashing", "Gutters", "Not sure"] };

    case "determine_inspection_reason":
      return {
        text: choose(["Sure. Is there anything you've noticed, or just a routine check?", "Sure. Anything specific you've noticed, or more of a routine check?"]),
        suggestions: ["Just a routine check", "I noticed something", "Buying or selling"],
      };

    case "request_photo": {
      const surface = surfaceIn(a.leak_location);
      if ((a.visible_damage?.length ?? 0) > 0 || a.missing_shingles) {
        return { text: choose(["A photo would help. Can you upload one?", "A photo of that would really help. Can you add one?"]), suggestions: ["I don't have one right now"] };
      }
      if (surface && a.interior_damage) {
        return { text: `A photo of the ${surface} would help. Can you upload one?`, suggestions: ["I don't have one right now"] };
      }
      return { text: choose(["A photo would help here. Can you upload one?", "Got a photo you can share? It helps a lot."]), suggestions: ["I don't have one right now"] };
    }

    case "determine_roof_age":
      return {
        text: choose(["How old is the roof?", "About how old is the roof?", "Roughly how old is the roof?", "Any idea how old the roof is?"]),
        suggestions: ["Under 5 years", "5–10 years", "10–20 years", "Over 20 years", "Not sure"],
      };

    case "determine_roof_material":
      if (a.roof_material === "asphalt shingles" && (c.confidence.roof_material ?? 0) < 0.7) {
        return { text: "Is it an asphalt shingle roof?", suggestions: ["Yes, shingles", "Metal", "Tile", "Not sure"] };
      }
      return {
        text: choose(["What's the roof made of: shingles, metal, tile?", "What kind of roof is it: shingles, metal, something else?"]),
        suggestions: ["Asphalt shingles", "Metal", "Tile", "Flat roof", "Not sure"],
      };

    case "determine_roof_size":
      return {
        text: choose(["About how big is the house?", "Roughly how many square feet is the home?", "About how big is the house? A rough square footage works."]),
        suggestions: ["Under 1,500 sq ft", "1,500–2,500 sq ft", "Over 2,500 sq ft", "Not sure"],
      };

    case "determine_stories":
      return { text: choose(["Is it one story or two?", "How many stories is the house?"]), suggestions: ["One story", "Two stories", "Three or more"] };

    case "determine_replacement_interest":
      return { text: choose(["Are you leaning toward a repair or a full replacement?", "Leaning toward a repair, or a new roof?"]), suggestions: ["Repair if possible", "Full replacement", "Not sure yet"] };

    case "determine_urgency":
      return { text: choose(["Is it getting worse, or holding steady?", "How soon are you hoping to get it handled?"]), suggestions: ["Getting worse", "Holding steady", "No rush"] };

    case "confirm_detail": {
      const pending = c.pending_confirmation;
      if (!pending) return null;
      if (pending.field === "roof_age") {
        return { text: `Just to check — about ${pending.previous} or ${pending.latest} years?`, suggestions: [`About ${pending.previous}`, `About ${pending.latest}`] };
      }
      if (pending.field === "stories") {
        return { text: `Just to check — ${pending.previous} or ${pending.latest} stories?`, suggestions: [`${pending.previous}`, `${pending.latest}`] };
      }
      return { text: `Just to check — ${pending.previous} or ${pending.latest}?`, suggestions: [`${pending.previous}`, `${pending.latest}`] };
    }

    case "offer_estimate":
      return { text: choose(["Want me to work out a rough range?", "Want a rough range for your roof?"]), suggestions: ["Yes, please", "Not right now"] };

    case "provide_estimate":
      return null;

    case "determine_contact":
      if (askedBefore) return { text: choose(["And your name?", "What name should I give the team?"]) };
      if (c.callback_requested) return { text: choose(["Sure. What's your name?", "Happy to. What's your name?"]) };
      if (c.emergency || a.urgency === "emergency") return { text: "Let's get the team on this. What's your name?" };
      if (intent === "inspection" || intent === "other") {
        return { text: choose(["I can set that up with the team. What's your name?", "I can get the team to set that up. What's your name?"]) };
      }
      if (input.plan.showEstimate) {
        return { text: choose(["What's your name? I'll get this over to the team.", "I can pass this to the team. What's your name?"]) };
      }
      return { text: choose(["I can get this over to the team. What's your name?", "I can pass this to the team. What's your name?"]) };

    case "determine_phone": {
      if (contactTarget(a) === "email") return { text: "What's the best email for you?" };
      if (analysis.invalidPhone) {
        return { text: choose(["That number looks a digit off. Mind checking it?", "Hmm, that number seems short. Mind double-checking it?"]) };
      }
      if (askedBefore) return { text: choose(["And the best number for you?", "What number should the team use?"]) };
      if (c.callback_requested) return { text: "What number should they call?" };
      const ask = choose(["Best number to reach you?", "What's the best number for you?", "What number should the team use?"]);
      return { text: first && analysis.updates.some((update) => update.field === "name") ? `Thanks, ${first}. ${ask}` : ask };
    }

    case "determine_address":
      return { text: choose(["What's the property address?", "What's the address there?", "And the property address?"]) };

    case "determine_contact_preference":
      if (preferenceTarget(a) === "preferred_time") {
        return { text: "Any days or times that work best for a visit?", suggestions: ["Weekday mornings", "Weekday afternoons", "Weekends", "Anytime"] };
      }
      return { text: choose(["Is text okay, or would you rather a call?", "Better to call or text?"]), suggestions: ["Text is fine", "Call me", "Email"] };

    case "human_handoff": {
      const base = choose(["Sure. I can get you over to the team.", "Of course. I can get you to the team."]);
      return { text: input.business.hours ? `${base} They're available ${input.business.hours}.` : base };
    }

    case "wrap_up": {
      if (c.contact_declined && !a.phone && !a.email) {
        return { text: `No problem. You can reach the team at ${input.business.phoneDisplay} whenever you're ready.` };
      }
      const name = first ? `, ${first}` : "";
      const base = c.callback_requested
        ? `Thanks${name}. I've asked the team to call you back.`
        : choose([`Thanks${name}. The team has everything and will be in touch.`, `You're all set${name}. The team will follow up with you.`]);
      const questions = c.team_questions.map(policyLabel);
      return { text: questions.length > 0 ? `${base} I've passed on your question about ${listJoin(questions)} too.` : base };
    }

    case "close":
      return { text: c.completed ? "No problem. Take care." : "No problem." };
  }
}

// ---------------------------------------------------------------------------
// Answers to the homeowner's own questions
// ---------------------------------------------------------------------------

function answerFor(input: PhraseInput): string | null {
  const { analysis, assessment: a, business, plan, seed } = input;
  const signals = analysis.signals;

  if (signals.botQuestion) {
    return "I'm Roof One's automated advisor. I can get you to someone on the team anytime.";
  }
  if (signals.outOfScope) return "I can help with the roof.";
  if (signals.policyTopic) {
    const configured = business.policies[signals.policyTopic];
    if (configured) return configured;
    return pick(["I'm not sure on that one. I can have the team confirm.", "I don't want to guess on that. I can have the team confirm."], `${seed}:policy`);
  }
  if (signals.pricingQuestion && !plan.showEstimate) {
    const aboutReplacement =
      input.context.estimate.focus === "replacement" || a.intent === "replacement" || a.intent === "pricing";
    if (aboutReplacement) return "It depends mostly on size, material and the roof's condition.";
    if (a.intent === "leak" || a.intent === "repair" || a.intent === "storm_damage") {
      return "Repairs depend mostly on the cause and how much is damaged.";
    }
    return "It depends on what's going on with the roof.";
  }
  switch (signals.generalTopic) {
    case "lifespan":
      return "Asphalt shingles often last 20 to 30 years, depending on climate and ventilation. Metal usually lasts longer.";
    case "repair_or_replace":
      return "Usually it comes down to the roof's age and how widespread the damage is.";
    case "can_it_wait":
      return a.active_leak === true
        ? "Water getting in usually gets worse, so sooner is better."
        : "Hard to say without a look, but it's best not to let it sit too long.";
    case "meantime":
      return "Catch any drips with a bucket and move valuables out of the way. Please don't go up on the roof yourself.";
    case "cause":
      return "It could be a few things, like flashing, shingles or a vent. The team can pin it down.";
    default:
      break;
  }
  if (signals.question && !signals.humanRequest && analysis.updates.length === 0 && !analysis.answeredLastGoal) {
    return "Good question. I'll make sure the team covers that.";
  }
  return null;
}

function safetyLineFor(input: PhraseInput): string | null {
  const { analysis, previousContext } = input;
  if (previousContext.emergency) return null;
  if (analysis.signals.electricalHazard) {
    return "If water's near any lights or outlets, stay clear of that area and call the appropriate emergency service if needed.";
  }
  if (analysis.signals.emergency) return "That sounds urgent. Stay clear of that area if you can.";
  if (input.assessment.exposed_roof === true && input.previous.exposed_roof !== true) return "That needs attention fast.";
  return null;
}

// ---------------------------------------------------------------------------
// Acknowledgements
// ---------------------------------------------------------------------------

const GENERIC_ACKS = ["Okay.", "Right.", "Ah, okay.", "Makes sense.", "Alright.", "Got it.", "That helps."] as const;

function opener(reply: string | null): string {
  return (reply ?? "").split(/[.!?—,]/)[0]?.trim().toLowerCase() ?? "";
}

function acknowledgementFor(input: PhraseInput, question: Question | null): string | null {
  const { analysis, assessment: a, seed, context: c } = input;
  const s = `${seed}:ack`;
  const previousOpener = opener(input.lastAdvisorReply);
  const questionText = question?.text ?? "";
  if (/^(?:sure|thanks|of course|happy to|no problem|just to check)\b/i.test(questionText)) return null;

  // "That helps. A photo would help." sounds like an echo.
  const echoes = (ack: string) =>
    ack
      .toLowerCase()
      .match(/[a-z]{4,}/g)
      ?.some((word) => questionText.toLowerCase().includes(word.replace(/s$/, ""))) ?? false;
  const choose = (options: readonly string[]): string | null => {
    const fresh = options.filter((option) => opener(option) !== previousOpener && !echoes(option));
    return fresh.length > 0 ? pick(fresh, s) : null;
  };

  if (analysis.photoShared) return choose(["Thanks.", "Thanks, that helps.", "Got it, thanks."]);
  if (analysis.signals.dontKnow && analysis.unknownFields.length > 0) return choose(["No problem.", "No worries.", "That's okay."]);
  if (analysis.signals.greetingOnly) return choose(["Hey!", "Hi!"]);
  if (analysis.signals.thanksOnly) return choose(["Sure thing.", "Of course."]);
  if (analysis.updates.some((update) => update.field === "name") && a.name && !questionText.includes(firstName(a.name) ?? "")) {
    return `Thanks, ${firstName(a.name)}.`;
  }
  // The first reply goes straight to the question: no "Got it" to open a conversation.
  if (c.turn <= 1 && !analysis.signals.correction) return null;
  if (analysis.signals.correction) return choose(["Okay.", "Got it."]);

  const optional = (options: readonly string[]) => (hashSkip(s) ? null : choose(options));
  const answeredContact = input.previousContext.last_goal !== null && CONTACT_GOALS.has(input.previousContext.last_goal);
  if (answeredContact) return optional(["Thanks.", "Got it, thanks."]);
  if (input.changed.length >= 3) return optional(["That helps.", "Okay, that's helpful.", "Okay."]);
  if (analysis.signals.negative) return optional(["Okay.", "Alright.", "Good to know."]);
  if (a.storm_damage === true && input.previous.storm_damage !== true) return optional(["Ah, okay.", "Okay.", "Sorry to hear that."]);
  if (!analysis.answeredLastGoal) return null;
  return optional(GENERIC_ACKS);
}

/** Roughly two in five replies skip the acknowledgement entirely. */
function hashSkip(seed: string): boolean {
  return stableHash(`${seed}:skip`) % 5 < 2;
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

const ESTIMATE_LEADS = [
  "Okay, I can work with that.",
  "Here's a rough range to plan around.",
  "That's enough for a rough range.",
] as const;

export function composeReply(input: PhraseInput): Phrased {
  const { plan, analysis, seed } = input;
  const goal = plan.next?.goal ?? null;

  if (plan.close) {
    return { reply: questionFor("close", input)?.text ?? "No problem.", suggestions: [] };
  }
  if (plan.handoff) {
    return { reply: questionFor("human_handoff", input)?.text ?? "Sure. I can get you over to the team.", suggestions: [] };
  }

  const question = goal ? questionFor(goal, input) : null;
  const safety = safetyLineFor(input);
  const answer = answerFor(input);
  const estimateLead = plan.showEstimate ? pick(ESTIMATE_LEADS, `${seed}:estimate`) : null;
  // "No problem." for something they don't know survives an estimate lead-in; other acknowledgements don't.
  const dontKnowAck = analysis.signals.dontKnow && analysis.unknownFields.length > 0;
  const ack =
    safety || answer || goal === "wrap_up" || (estimateLead && !dontKnowAck)
      ? null
      : acknowledgementFor(input, question);

  let questionText = question?.text ?? null;
  if (!questionText) {
    if (analysis.signals.thanksOnly || analysis.signals.stop) questionText = "Anytime. Take care.";
    else if (input.context.completed) questionText = analysis.updates.length > 0 ? "Got it. I'll add that for the team." : "Anything else I can help with?";
    else questionText = "Anything else I can help with?";
  }
  if (answer === "I can help with the roof." && goal === "identify_issue") questionText = "What's going on?";

  const reply = [ack, safety, answer, estimateLead, questionText]
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return { reply, suggestions: [...(question?.suggestions ?? [])].slice(0, 5) };
}
