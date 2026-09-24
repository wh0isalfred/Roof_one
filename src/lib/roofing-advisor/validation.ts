import { isValidEmail, normalizePhone } from "./extraction";
import { createAssessment, createContext } from "./state";
import {
  ADVISOR_CONTACT_METHODS,
  ADVISOR_GOALS,
  ADVISOR_INTENTS,
  ADVISOR_STAGES,
  ADVISOR_URGENCIES,
  ASSESSMENT_FIELD_KINDS,
  ASSESSMENT_FIELDS,
  POLICY_TOPICS,
  type AdvisorAIResponse,
  type AdvisorAttachment,
  type AdvisorContext,
  type AdvisorGoal,
  type AdvisorMessage,
  type AdvisorMessageRequest,
  type AssessmentField,
  type PendingConfirmation,
  type RoofingAssessment,
} from "./types";

/*
 * Validation at the edges: requests coming in from the browser, and JSON
 * coming back from the AI provider. Nothing that fails here reaches the
 * homeowner.
 */

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

export const LIMITS = {
  messageLength: 2000,
  historyMessages: 60,
  historyMessageLength: 4000,
  attachmentsPerMessage: 4,
  textFieldLength: 500,
  suggestions: 4,
  suggestionLength: 40,
  replyLength: 600,
} as const;

function includes<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Assessment values
// ---------------------------------------------------------------------------

/** Checks one field's value. Returns undefined when it isn't valid for the field. */
function coerceField(field: AssessmentField, value: unknown): unknown {
  if (value === null) return null;
  const kind = ASSESSMENT_FIELD_KINDS[field];
  switch (kind) {
    case "text": {
      if (typeof value !== "string") return undefined;
      const text = value.replace(/\s+/g, " ").trim().slice(0, LIMITS.textFieldLength);
      if (!text) return null;
      if (field === "phone") return normalizePhone(text) ?? undefined;
      if (field === "email") return isValidEmail(text) ? text.toLowerCase() : undefined;
      if (field === "zip_code") return /^\d{5}(?:-\d{4})?$/.test(text) ? text : undefined;
      if (field === "state") return /^[A-Za-z]{2}$/.test(text) ? text.toUpperCase() : text;
      return text;
    }
    case "boolean":
      return typeof value === "boolean" ? value : undefined;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
      if (field === "roof_age") return value >= 0 && value <= 100 ? Math.round(value) : undefined;
      if (field === "stories") return value >= 1 && value <= 6 ? Math.round(value) : undefined;
      return value;
    case "list":
      if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) return undefined;
      return value
        .map((item: string) => item.replace(/\s+/g, " ").trim().slice(0, 120))
        .filter(Boolean)
        .slice(0, 12);
    case "intent":
      return includes(ADVISOR_INTENTS, value) ? value : undefined;
    case "urgency":
      return includes(ADVISOR_URGENCIES, value) ? value : undefined;
    case "contact_method":
      return includes(ADVISOR_CONTACT_METHODS, value) ? value : undefined;
  }
}

/** A clean assessment from untrusted input. Unknown keys are dropped; bad values become null. */
export function sanitizeAssessment(input: unknown): RoofingAssessment {
  const assessment = createAssessment();
  if (!isRecord(input)) return assessment;
  for (const field of ASSESSMENT_FIELDS) {
    const value = coerceField(field, input[field]);
    if (value !== undefined) (assessment as Record<AssessmentField, unknown>)[field] = value;
  }
  return assessment;
}

function sanitizePending(input: unknown): PendingConfirmation | null {
  if (!isRecord(input)) return null;
  const fields: PendingConfirmation["field"][] = ["roof_age", "roof_material", "home_size", "roof_size", "stories"];
  if (!includes(fields, input.field)) return null;
  const ok = (value: unknown) => typeof value === "number" || (typeof value === "string" && value.length <= 120);
  if (!ok(input.previous) || !ok(input.latest)) return null;
  return { field: input.field, previous: input.previous as string | number, latest: input.latest as string | number };
}

/** Conversation bookkeeping from untrusted input, falling back to a fresh context. */
export function sanitizeContext(input: unknown): AdvisorContext {
  const context = createContext();
  if (!isRecord(input)) return context;

  if (includes(ADVISOR_STAGES, input.stage)) context.stage = input.stage;
  if (typeof input.turn === "number" && Number.isInteger(input.turn) && input.turn >= 0) {
    context.turn = Math.min(input.turn, 10_000);
  }
  if (isRecord(input.confidence)) {
    for (const [key, value] of Object.entries(input.confidence)) {
      if ((key === "intent" || includes(ASSESSMENT_FIELDS, key)) && typeof value === "number" && value >= 0 && value <= 1) {
        context.confidence[key as AssessmentField | "intent"] = value;
      }
    }
  }
  if (Array.isArray(input.unknown)) {
    context.unknown = [...new Set(input.unknown.filter((field): field is AssessmentField => includes(ASSESSMENT_FIELDS, field)))];
  }
  if (isRecord(input.asked)) {
    context.asked = {};
    for (const [key, value] of Object.entries(input.asked)) {
      if (includes(ADVISOR_GOALS, key) && typeof value === "number" && Number.isInteger(value) && value >= 0) {
        context.asked[key] = Math.min(value, 50);
      }
    }
  }
  context.last_goal = includes(ADVISOR_GOALS, input.last_goal) ? input.last_goal : input.last_goal === null ? null : context.last_goal;
  if (Array.isArray(input.recent_fields)) {
    context.recent_fields = input.recent_fields.filter((field): field is AssessmentField => includes(ASSESSMENT_FIELDS, field));
  }
  context.pending_confirmation = sanitizePending(input.pending_confirmation);
  if (isRecord(input.estimate)) {
    for (const key of ["offered", "requested", "declined", "shown"] as const) {
      if (typeof input.estimate[key] === "boolean") context.estimate[key] = input.estimate[key];
    }
    if (input.estimate.focus === "replacement" || input.estimate.focus === "repair") {
      context.estimate.focus = input.estimate.focus;
    }
  }
  for (const key of ["handoff_requested", "callback_requested", "emergency", "contact_declined", "completed", "closed"] as const) {
    if (typeof input[key] === "boolean") context[key] = input[key];
  }
  if (includes(ADVISOR_URGENCIES, input.stated_urgency)) context.stated_urgency = input.stated_urgency;
  if (Array.isArray(input.team_questions)) {
    context.team_questions = [...new Set(input.team_questions.filter((topic) => includes(POLICY_TOPICS, topic)))];
  }
  return context;
}

export function sanitizeAttachments(input: unknown): AdvisorAttachment[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(isRecord)
    .filter((item) => item.kind === "photo" && typeof item.id === "string" && item.id.length <= 64)
    .slice(0, LIMITS.attachmentsPerMessage)
    .map((item) => ({
      id: String(item.id),
      kind: "photo" as const,
      name: typeof item.name === "string" ? item.name.slice(0, 120) : "photo",
      content_type: typeof item.content_type === "string" ? item.content_type.slice(0, 60) : "image/jpeg",
      size: typeof item.size === "number" && item.size >= 0 ? item.size : 0,
      storage_path: typeof item.storage_path === "string" ? item.storage_path.slice(0, 300) : null,
    }));
}

function sanitizeHistory(input: unknown): AdvisorMessage[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(isRecord)
    .filter((item) => (item.role === "user" || item.role === "advisor") && typeof item.content === "string")
    .slice(-LIMITS.historyMessages)
    .map((item) => ({
      id: typeof item.id === "string" ? item.id.slice(0, 64) : "",
      role: item.role as AdvisorMessage["role"],
      content: (item.content as string).slice(0, LIMITS.historyMessageLength),
      created_at: typeof item.created_at === "string" ? item.created_at.slice(0, 40) : new Date(0).toISOString(),
      goal: includes(ADVISOR_GOALS, item.goal) ? item.goal : null,
      attachments: sanitizeAttachments(item.attachments),
    }));
}

/** Validates the body of POST /api/roofing-advisor/message. */
export function parseMessageRequest(body: unknown): Result<Required<Omit<AdvisorMessageRequest, "messageId">> & { messageId: string | null }> {
  if (!isRecord(body)) return { ok: false, errors: ["Body must be a JSON object."] };
  const errors: string[] = [];
  if (!isUuid(body.conversationId)) errors.push("conversationId must be a UUID.");
  if (typeof body.message !== "string") errors.push("message must be a string.");
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length > LIMITS.messageLength) errors.push(`message must be at most ${LIMITS.messageLength} characters.`);
  const attachments = sanitizeAttachments(body.attachments);
  if (!message && attachments.length === 0) errors.push("message is empty.");
  if (body.messageId !== undefined && !isUuid(body.messageId)) errors.push("messageId must be a UUID.");
  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      conversationId: body.conversationId as string,
      messageId: (body.messageId as string | undefined) ?? null,
      message,
      assessment: sanitizeAssessment(body.assessment),
      history: sanitizeHistory(body.history),
      context: sanitizeContext(body.context),
      attachments,
    },
  };
}

// ---------------------------------------------------------------------------
// The AI response contract
// ---------------------------------------------------------------------------

const RESPONSE_KEYS = new Set([
  "reply",
  "intent",
  "updates",
  "confidence",
  "next_goal",
  "suggestions",
  "request_photo",
  "request_contact",
  "show_estimate",
  "handoff",
  "handoff_reason",
  "conversation_complete",
]);

const BOOLEAN_KEYS = ["request_photo", "request_contact", "show_estimate", "handoff", "conversation_complete"] as const;

/**
 * Strictly checks an AI turn against the contract: valid JSON shape, no
 * extra keys, known fields and goals, sensible values.
 */
export function parseAdvisorAIResponse(input: unknown): Result<AdvisorAIResponse> {
  if (!isRecord(input)) return { ok: false, errors: ["Response must be a JSON object."] };
  const errors: string[] = [];

  for (const key of Object.keys(input)) {
    if (!RESPONSE_KEYS.has(key)) errors.push(`Unexpected key "${key}".`);
  }

  if (typeof input.reply !== "string" || !input.reply.trim()) errors.push("reply must be a non-empty string.");
  else if (input.reply.length > LIMITS.replyLength) errors.push("reply is too long.");

  if (input.intent !== undefined && input.intent !== null && !includes(ADVISOR_INTENTS, input.intent)) {
    errors.push("intent is not a known intent.");
  }

  const updates: Partial<RoofingAssessment> = {};
  if (input.updates !== undefined) {
    if (!isRecord(input.updates)) {
      errors.push("updates must be an object.");
    } else {
      for (const [key, value] of Object.entries(input.updates)) {
        if (!includes(ASSESSMENT_FIELDS, key)) {
          errors.push(`updates.${key} is not an assessment field.`);
          continue;
        }
        const coerced = coerceField(key, value);
        if (coerced === undefined) errors.push(`updates.${key} has an invalid value.`);
        else (updates as Record<AssessmentField, unknown>)[key] = coerced;
      }
    }
  }

  const confidence: Record<string, number> = {};
  if (input.confidence !== undefined) {
    if (!isRecord(input.confidence)) {
      errors.push("confidence must be an object.");
    } else {
      for (const [key, value] of Object.entries(input.confidence)) {
        if (key !== "intent" && !includes(ASSESSMENT_FIELDS, key)) errors.push(`confidence.${key} is not a known field.`);
        else if (typeof value !== "number" || value < 0 || value > 1) errors.push(`confidence.${key} must be between 0 and 1.`);
        else confidence[key] = value;
      }
    }
  }

  if (input.next_goal !== undefined && !includes(ADVISOR_GOALS, input.next_goal)) {
    errors.push("next_goal is not a known goal.");
  }

  let suggestions: string[] | undefined;
  if (input.suggestions !== undefined) {
    if (!Array.isArray(input.suggestions) || !input.suggestions.every((item) => typeof item === "string")) {
      errors.push("suggestions must be an array of strings.");
    } else {
      suggestions = input.suggestions
        .map((item: string) => item.trim())
        .filter((item) => item.length > 0 && item.length <= LIMITS.suggestionLength && !/https?:|www\./i.test(item))
        .slice(0, LIMITS.suggestions);
    }
  }

  for (const key of BOOLEAN_KEYS) {
    if (input[key] !== undefined && typeof input[key] !== "boolean") errors.push(`${key} must be a boolean.`);
  }
  if (input.handoff_reason !== undefined && (typeof input.handoff_reason !== "string" || input.handoff_reason.length > 200)) {
    errors.push("handoff_reason must be a short string.");
  }

  if (errors.length > 0) return { ok: false, errors };

  const value: AdvisorAIResponse = { reply: (input.reply as string).trim() };
  if (input.intent !== undefined) value.intent = input.intent as AdvisorAIResponse["intent"];
  if (input.updates !== undefined) value.updates = updates;
  if (input.confidence !== undefined) value.confidence = confidence;
  if (input.next_goal !== undefined) value.next_goal = input.next_goal as AdvisorGoal;
  if (suggestions !== undefined) value.suggestions = suggestions;
  for (const key of BOOLEAN_KEYS) if (typeof input[key] === "boolean") value[key] = input[key] as boolean;
  if (typeof input.handoff_reason === "string") value.handoff_reason = input.handoff_reason;
  return { ok: true, value };
}

/** Pulls the JSON object out of a model's text, tolerating a stray code fence. */
export function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end <= start) throw new SyntaxError("No JSON object found.");
  return JSON.parse(trimmed.slice(start, end + 1));
}

// ---------------------------------------------------------------------------
// Reply guardrails
// ---------------------------------------------------------------------------

/** Customer-service and AI tells the advisor must never use. */
export const BANNED_PHRASES = [
  /thank you for (?:providing|sharing|reaching out|contacting)/i,
  /based on (?:the|what) (?:information|details) (?:you(?:'ve)? )?provided/i,
  /i understand your concern/i,
  /\bas an ai\b/i,
  /\bai[- ]powered\b/i,
  /\blanguage model\b/i,
  /i (?:would|'d) be (?:happy|glad|delighted) to (?:assist|help you with)/i,
  /could you please provide/i,
  /please provide/i,
  /i apologi[sz]e for any inconvenience/i,
  /rest assured/i,
  /valued customer/i,
] as const;

const PRICE = /\$\s?\d|\b\d[\d,.]*\s?(?:dollars|bucks|usd|grand)\b|\b\d+(?:\.\d+)?k\b(?!\s*(?:sq|square))/i;

// Claims about Roof One that only the company can make.
const POLICY_CLAIM =
  /\bwe(?:'re| are| do| can| will| offer| provide| accept| take| work with| have| guarantee)\b[^.?!]{0,50}\b(?:financ\w*|insurance|warrant\w*|guarantee\w*|licensed|insured|bonded|certified|same[- ]day|24\/7|free (?:inspection|estimate|quote)s?|serve|service (?:your|that) area)\b/i;
const AVAILABILITY_PROMISE =
  /\b(?:will|'ll|can)\s+(?:be|come|get|call|reach|have someone|send someone)\b[^.?!]{0,40}\b(?:today|tonight|tomorrow|within|same[- ]day|right away|immediately|in (?:an|\d+) (?:hours?|minutes?))\b/i;
const CERTAIN_DIAGNOSIS = /\b(?:definitely|certainly|100%|guaranteed)\s+(?:the|a|your|caused|coming from)\b/i;

export interface ReplyReviewOptions {
  /** The homeowner asked a question, so a longer answer is fine. */
  answeringQuestion: boolean;
  previousReply: string | null;
  /** Topics the company has configured answers for. */
  configuredPolicies: readonly string[];
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Checks an AI reply against the voice and safety rules. Fixes what it safely can. */
export function reviewReply(reply: string, options: ReplyReviewOptions): Result<string> {
  let text = reply
    .replace(/\*\*|__/g, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  const errors: string[] = [];

  if (/```|^#+\s/m.test(reply)) errors.push("Reply contains Markdown.");
  if (BANNED_PHRASES.some((pattern) => pattern.test(text))) errors.push("Reply uses a banned phrase.");
  if (PRICE.test(text)) errors.push("Reply states a price. Prices come only from the estimate engine.");
  if (POLICY_CLAIM.test(text) && options.configuredPolicies.length === 0) errors.push("Reply makes a company claim.");
  if (AVAILABILITY_PROMISE.test(text)) errors.push("Reply promises availability.");
  if (CERTAIN_DIAGNOSIS.test(text)) errors.push("Reply diagnoses with certainty.");
  if ((text.match(/\?/g) ?? []).length > 2) errors.push("Reply asks more than one question.");
  const limit = options.answeringQuestion ? 70 : 40;
  if (wordCount(text) > limit) errors.push(`Reply is longer than ${limit} words.`);

  // Don't open with the same acknowledgement twice in a row.
  const opener = /^(got it|okay|ok|alright|right|makes sense|that helps|thanks|no problem)[.!,]\s+/i.exec(text);
  const previousOpener = /^(got it|okay|ok|alright|right|makes sense|that helps|thanks|no problem)\b/i.exec(options.previousReply ?? "");
  if (opener && previousOpener && opener[1]?.toLowerCase() === previousOpener[1]?.toLowerCase()) {
    const rest = text.slice(opener[0].length);
    text = rest.charAt(0).toUpperCase() + rest.slice(1);
  }
  if (!text) errors.push("Reply is empty.");

  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: text };
}
