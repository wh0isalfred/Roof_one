import { type AdvisorBusinessConfig, advisorConfig } from "@/config/advisor";
import type { NewLead } from "@/lib/leads/types";
import {
  type AdvisorState,
  applyAnalysis,
  applyProviderUpdates,
  assessmentCompleteness,
  deriveUrgency,
  diffAssessment,
  hasContactDetails,
  resolveIntent,
} from "./assessment";
import { type AdvisorEvent, createAdvisorEvent } from "./events";
import { analyzeMessage, goalFields, type MessageAnalysis } from "./extraction";
import { findAffirmed, REPLACEMENT_PATTERNS } from "./intents";
import {
  CONTACT_GOALS,
  type GoalCandidate,
  type GoalPlan,
  MAX_ASKS,
  planGoals,
  stageFor,
} from "./goals";
import { toNewLead } from "./leads";
import { estimateFromAssessment } from "./pricing";
import type { AdvisorInput, RoofingAdvisorProvider } from "./provider";
import { LocalAdvisorProvider } from "./providers/local";
import { isKnown } from "./state";
import type {
  AdvisorAIResponse,
  AdvisorAttachment,
  AdvisorContext,
  AdvisorGoal,
  AdvisorMessage,
  EstimateResult,
  RoofingAssessment,
} from "./types";
import { parseAdvisorAIResponse, type Result, reviewReply } from "./validation";

/*
 * The Roofing Advisor engine.
 *
 *   message → understand → extract → update the assessment → rank what
 *   matters next → choose a goal → phrase a short reply
 *
 * The AI provider (when configured) understands and phrases; this engine
 * owns everything that must stay deterministic: state, pricing, stage,
 * handoff, completion, events and the lead.
 */

export interface AdvisorTurnInput {
  conversationId: string;
  /** Client-generated id for the homeowner's message, so retries don't duplicate it. */
  messageId?: string | null;
  message: string;
  attachments?: AdvisorAttachment[];
  /** The conversation so far, not including this message. */
  history: AdvisorMessage[];
  assessment: RoofingAssessment;
  context: AdvisorContext;
}

export interface AdvisorTurnOptions {
  /** The AI provider. Without one, the local provider answers. */
  provider?: RoofingAdvisorProvider | null;
  business?: AdvisorBusinessConfig;
  now?: Date;
  createId?: () => string;
  onProviderError?: (error: unknown) => void;
  onProviderRejected?: (errors: string[]) => void;
}

export interface AdvisorTurnResult {
  response: AdvisorAIResponse;
  assessment: RoofingAssessment;
  context: AdvisorContext;
  /** The estimate shown this turn, if any. */
  estimate: EstimateResult | null;
  userMessage: AdvisorMessage;
  advisorMessage: AdvisorMessage;
  events: AdvisorEvent[];
  /** The lead row, once there are contact details. Creation is idempotent per conversation. */
  lead: NewLead | null;
  /** Internal lead quality. Never shown to the homeowner. */
  completeness: ReturnType<typeof assessmentCompleteness>;
  /** Which provider wrote the reply. */
  source: string;
}

const localProvider = new LocalAdvisorProvider();

/** Goals that leave the advisor waiting on an answer. */
const NON_QUESTION_GOALS: ReadonlySet<AdvisorGoal> = new Set([
  "human_handoff",
  "wrap_up",
  "close",
  "provide_estimate",
]);

interface Outcome {
  state: AdvisorState;
  plan: GoalPlan;
  response: AdvisorAIResponse;
  source: string;
}

/** Whether the homeowner changed the subject rather than skipping the question. */
function isInterruption(analysis: MessageAnalysis): boolean {
  const s = analysis.signals;
  return (
    s.question ||
    s.pricingQuestion ||
    s.policyTopic !== null ||
    s.generalTopic !== null ||
    s.outOfScope ||
    s.botQuestion ||
    s.humanRequest ||
    s.stop ||
    s.greetingOnly ||
    s.thanksOnly ||
    s.correction ||
    s.continueChat ||
    analysis.photoShared ||
    analysis.updates.length > 0 ||
    analysis.intent !== null
  );
}

function applyConversationSignals(
  state: AdvisorState,
  analysis: MessageAnalysis,
  previous: AdvisorContext,
  business: AdvisorBusinessConfig,
): void {
  const c = state.context;
  const s = analysis.signals;
  c.turn = previous.turn + 1;
  // Any new message reopens a conversation they'd closed.
  c.closed = s.stop;

  if (s.humanRequest) {
    c.handoff_requested = true;
    if (s.callbackRequest) c.callback_requested = true;
  }
  if (analysis.estimateAccepted) {
    c.estimate.requested = true;
    c.estimate.declined = false;
  } else if (analysis.estimateDeclined) {
    c.estimate.declined = true;
    c.estimate.requested = false;
  } else if (
    s.pricingQuestion &&
    (previous.estimate.offered || previous.estimate.shown || previous.estimate.declined)
  ) {
    // Asking again after an offer means yes.
    c.estimate.requested = true;
    c.estimate.declined = false;
  }
  if (analysis.contactDeclined) c.contact_declined = true;
  if (s.pricingQuestion) {
    const aboutReplacement = findAffirmed(analysis.text, REPLACEMENT_PATTERNS) !== null;
    const conversationIsRepair = ["leak", "repair", "storm_damage"].includes(state.assessment.intent ?? "");
    if (aboutReplacement && conversationIsRepair) c.estimate.focus = "replacement";
    else if (!aboutReplacement && conversationIsRepair) c.estimate.focus = null;
  }

  const topic = s.policyTopic;
  if (topic && !business.policies[topic] && !c.team_questions.includes(topic)) {
    c.team_questions.push(topic);
  }

  // They replied, but not with anything usable for the question: don't ask it again.
  const last = previous.last_goal;
  if (last && !analysis.answeredLastGoal && !isInterruption(analysis) && analysis.raw) {
    if (last === "determine_contact" || last === "determine_phone") {
      if ((previous.asked[last] ?? 0) >= MAX_ASKS) c.contact_declined = true;
    } else {
      for (const field of goalFields(last, state.assessment)) {
        if (field !== "intent" && !isKnown(state.assessment, field) && !c.unknown.includes(field)) {
          c.unknown.push(field);
        }
      }
    }
  }
}

function allowedGoals(plan: GoalPlan): Set<AdvisorGoal> {
  if (plan.close) return new Set(["close"]);
  if (plan.handoff) return new Set(["human_handoff"]);
  const allowed = new Set<AdvisorGoal>(plan.candidates.slice(0, 4).map((candidate) => candidate.goal));
  if (plan.complete || plan.candidates.length === 0) allowed.add("wrap_up");
  if (plan.showEstimate) allowed.add("provide_estimate");
  return allowed;
}

const reject = (...errors: string[]): Result<never> => ({ ok: false, errors });

/**
 * Checks an AI turn against the deterministic plan. The AI can choose among
 * the top goals and word the reply; it can't skip a handoff, show or hide
 * the estimate on its own, ask for something already known, or break the
 * voice rules.
 */
function acceptProviderResponse(
  raw: AdvisorAIResponse,
  input: AdvisorInput,
): Result<Omit<Outcome, "source">> {
  const parsed = parseAdvisorAIResponse(raw);
  if (!parsed.ok) return parsed;
  const response = parsed.value;

  const { state } = applyProviderUpdates(input.draft, response.updates ?? {}, response.confidence ?? {});
  if (response.intent) {
    state.assessment.intent = resolveIntent(state.assessment.intent, {
      value: response.intent,
      confidence: response.confidence?.intent ?? 0.8,
      explicit: true,
    });
  }
  state.assessment.urgency = deriveUrgency(state, state.context.stated_urgency);

  let plan = planGoals({ assessment: state.assessment, context: state.context, analysis: input.analysis });
  const goal = response.next_goal as AdvisorGoal | undefined;
  if (!goal) return reject("next_goal is missing.");

  // The AI may hear a request for a person that the patterns missed.
  if (response.handoff && !plan.handoff) {
    plan = {
      ...plan,
      candidates: [{ goal: "human_handoff", reason: "They asked for a person." }],
      next: { goal: "human_handoff", reason: "They asked for a person." },
      handoff: true,
      showEstimate: false,
      stage: "human_handoff",
    };
  }
  if (goal === "close" && !plan.close) {
    const s = input.analysis.signals;
    if (!(s.stop || s.decline || s.thanksOnly)) return reject("The AI closed a conversation the homeowner didn't end.");
    state.context.closed = true;
    plan = { ...plan, next: { goal: "close", reason: "They're done." }, close: true, showEstimate: false, stage: "closed" };
  }

  const allowed = allowedGoals(plan);
  if (!allowed.has(goal)) return reject(`next_goal "${goal}" isn't one of: ${[...allowed].join(", ")}.`);
  if (Boolean(response.show_estimate) !== plan.showEstimate) return reject("show_estimate doesn't match the plan.");
  if (plan.handoff && !response.handoff) return reject("The homeowner asked for a person.");

  const review = reviewReply(response.reply, {
    answeringQuestion: input.analysis.signals.question,
    previousReply: [...input.history].reverse().find((message) => message.role === "advisor")?.content ?? null,
    configuredPolicies: Object.entries(input.business.policies)
      .filter(([, answer]) => answer !== null)
      .map(([topic]) => topic),
  });
  if (!review.ok) return review;

  const chosen: GoalCandidate =
    plan.candidates.find((candidate) => candidate.goal === goal) ?? { goal, reason: "" };
  plan = { ...plan, next: chosen };
  plan = { ...plan, stage: stageFor(state.assessment, state.context, plan) };

  return { ok: true, value: { state, plan, response: { ...response, reply: review.value } } };
}

/** One homeowner message in, one advisor reply out. */
export async function runAdvisorTurn(
  input: AdvisorTurnInput,
  options: AdvisorTurnOptions = {},
): Promise<AdvisorTurnResult> {
  const now = options.now ?? new Date();
  const business = options.business ?? advisorConfig;
  const createId = options.createId ?? (() => crypto.randomUUID());
  const attachments = input.attachments ?? [];
  const previous: AdvisorState = { assessment: input.assessment, context: input.context };

  // Understand the message and pull out everything useful in it.
  const analysis = analyzeMessage({
    message: input.message,
    attachments,
    assessment: previous.assessment,
    context: previous.context,
    now,
  });

  // Update the assessment, then decide what matters next.
  const applied = applyAnalysis(previous, analysis);
  applyConversationSignals(applied.state, analysis, previous.context, business);
  const plan = planGoals({ assessment: applied.state.assessment, context: applied.state.context, analysis });

  const providerInput: AdvisorInput = {
    conversationId: input.conversationId,
    message: analysis.raw,
    attachments,
    history: input.history,
    previous,
    draft: applied.state,
    changed: applied.changed,
    analysis,
    plan,
    estimate: plan.showEstimate ? estimateFromAssessment(applied.state.assessment, applied.state.context.estimate.focus) : null,
    business,
    seed: `${input.conversationId}:${applied.state.context.turn}`,
  };

  // The local reply is always ready, so a slow or invalid AI turn never leaves the homeowner waiting on nothing.
  let outcome: Outcome = {
    state: applied.state,
    plan,
    response: await localProvider.respond(providerInput),
    source: localProvider.name,
  };
  if (options.provider && options.provider.name !== localProvider.name) {
    try {
      const accepted = acceptProviderResponse(await options.provider.respond(providerInput), providerInput);
      if (accepted.ok) outcome = { ...accepted.value, source: options.provider.name };
      else options.onProviderRejected?.(accepted.errors);
    } catch (error) {
      options.onProviderError?.(error);
    }
  }

  return finalizeTurn(input, previous, analysis, outcome, { now, createId, attachments });
}

function finalizeTurn(
  input: AdvisorTurnInput,
  previous: AdvisorState,
  analysis: MessageAnalysis,
  outcome: Outcome,
  { now, createId, attachments }: { now: Date; createId: () => string; attachments: AdvisorAttachment[] },
): AdvisorTurnResult {
  const { plan, response } = outcome;
  const assessment = outcome.state.assessment;
  const context = outcome.state.context;
  const goal = (response.next_goal as AdvisorGoal | undefined) ?? plan.next?.goal ?? null;

  const estimate = plan.showEstimate ? estimateFromAssessment(assessment, context.estimate.focus) : null;
  if (estimate) {
    context.estimate.shown = true;
    context.estimate.offered = true;
    context.estimate.requested = false;
  }
  if (goal === "offer_estimate") context.estimate.offered = true;
  if (goal && !NON_QUESTION_GOALS.has(goal)) {
    context.asked[goal] = (context.asked[goal] ?? 0) + 1;
    context.last_goal = goal;
  } else {
    context.last_goal = null;
  }
  if (plan.complete) context.completed = true;
  if (plan.close) context.closed = true;
  if (plan.handoff) context.handoff_requested = true;
  context.stage = plan.stage;

  const id = input.conversationId;
  const events: AdvisorEvent[] = [];
  const firstCallback = analysis.signals.callbackRequest && !previous.context.callback_requested;
  if (plan.handoff || firstCallback) {
    events.push(
      createAdvisorEvent("HUMAN_REQUESTED", id, { callback: context.callback_requested, reason: response.handoff_reason ?? "Asked for a person." }, now),
    );
  }
  if (analysis.photoShared) {
    events.push(createAdvisorEvent("PHOTO_UPLOADED", id, { count: attachments.length, photo_ids: attachments.map((photo) => photo.id) }, now));
  }
  if (estimate) {
    events.push(
      createAdvisorEvent("ESTIMATE_GENERATED", id, { low: estimate.low, high: estimate.high, currency: estimate.currency, confidence: estimate.confidence }, now),
    );
  }
  if (hasContactDetails(assessment) && !hasContactDetails(previous.assessment)) {
    events.push(createAdvisorEvent("CONTACT_SUBMITTED", id, { preferred_contact_method: assessment.preferred_contact_method }, now));
  }
  if (plan.complete && !previous.context.completed) {
    events.push(createAdvisorEvent("ASSESSMENT_COMPLETED", id, { intent: assessment.intent, urgency: assessment.urgency }, now));
  }

  const shownEstimate = estimate ?? (context.estimate.shown ? estimateFromAssessment(assessment, context.estimate.focus) : null);
  const updates = diffAssessment(previous.assessment, assessment);
  const confidence: Record<string, number> = {};
  for (const field of Object.keys(updates)) {
    const value = context.confidence[field as keyof typeof context.confidence];
    if (value !== undefined) confidence[field] = value;
  }

  const finalResponse: AdvisorAIResponse = {
    reply: response.reply,
    intent: assessment.intent,
    updates,
    confidence,
    ...(goal ? { next_goal: goal } : {}),
    suggestions: response.suggestions ?? [],
    request_photo: goal === "request_photo",
    request_contact: goal !== null && CONTACT_GOALS.has(goal),
    show_estimate: estimate !== null,
    handoff: plan.handoff,
    ...(response.handoff_reason ? { handoff_reason: response.handoff_reason } : {}),
    conversation_complete: plan.complete || plan.close || context.completed,
  };

  const created = now.toISOString();
  return {
    response: finalResponse,
    assessment,
    context,
    estimate,
    userMessage: {
      id: input.messageId ?? createId(),
      role: "user",
      content: analysis.raw,
      created_at: created,
      goal: null,
      attachments,
    },
    advisorMessage: {
      id: createId(),
      role: "advisor",
      content: response.reply,
      created_at: new Date(now.getTime() + 1).toISOString(),
      goal,
      attachments: [],
    },
    events,
    lead: toNewLead(assessment, context, shownEstimate),
    completeness: assessmentCompleteness(assessment, plan.estimateReady),
    source: outcome.source,
  };
}
