/*
 * Roofing Advisor domain types.
 *
 * Shared by the chat UI, the API route and the engine, so this file holds
 * types and value lists only: no server code and no vendor SDKs.
 */

export const ADVISOR_INTENTS = [
  "leak",
  "storm_damage",
  "repair",
  "replacement",
  "inspection",
  "unknown",
  "pricing",
  "other",
] as const;

export type AdvisorIntent = (typeof ADVISOR_INTENTS)[number];

export const ADVISOR_URGENCIES = ["emergency", "high", "normal", "low"] as const;

export type AdvisorUrgency = (typeof ADVISOR_URGENCIES)[number];

export const ADVISOR_CONTACT_METHODS = ["phone", "text", "email"] as const;

export type AdvisorContactMethod = (typeof ADVISOR_CONTACT_METHODS)[number];

/**
 * Everything the advisor has learned about the homeowner's situation. Every
 * field starts as null ("not known yet"); nothing is required. The advisor
 * only collects what matters for the situation in front of it.
 */
export type RoofingAssessment = {
  intent: AdvisorIntent | null;
  urgency: AdvisorUrgency | null;
  issue_description: string | null;
  active_leak: boolean | null;
  leak_location: string | null;
  leak_frequency: string | null;
  issue_started: string | null;
  storm_damage: boolean | null;
  storm_date: string | null;
  visible_damage: string[] | null;
  missing_shingles: boolean | null;
  damaged_shingles: boolean | null;
  exposed_roof: boolean | null;
  interior_damage: boolean | null;
  interior_damage_description: string | null;
  roof_age: number | null;
  roof_material: string | null;
  roof_size: string | null;
  home_size: string | null;
  stories: number | null;
  current_condition: string | null;
  replacement_interest: boolean | null;
  repair_interest: boolean | null;
  inspection_interest: boolean | null;
  photos_available: boolean | null;
  photos_uploaded: boolean | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  preferred_contact_method: AdvisorContactMethod | null;
  preferred_time: string | null;
  notes: string | null;
};

export type AssessmentField = keyof RoofingAssessment;

/** Field name → the kind of value it holds. Drives validation and the AI output schema. */
export const ASSESSMENT_FIELD_KINDS = {
  intent: "intent",
  urgency: "urgency",
  issue_description: "text",
  active_leak: "boolean",
  leak_location: "text",
  leak_frequency: "text",
  issue_started: "text",
  storm_damage: "boolean",
  storm_date: "text",
  visible_damage: "list",
  missing_shingles: "boolean",
  damaged_shingles: "boolean",
  exposed_roof: "boolean",
  interior_damage: "boolean",
  interior_damage_description: "text",
  roof_age: "number",
  roof_material: "text",
  roof_size: "text",
  home_size: "text",
  stories: "number",
  current_condition: "text",
  replacement_interest: "boolean",
  repair_interest: "boolean",
  inspection_interest: "boolean",
  photos_available: "boolean",
  photos_uploaded: "boolean",
  address: "text",
  city: "text",
  state: "text",
  zip_code: "text",
  name: "text",
  phone: "text",
  email: "text",
  preferred_contact_method: "contact_method",
  preferred_time: "text",
  notes: "text",
} as const satisfies Record<AssessmentField, string>;

export const ASSESSMENT_FIELDS = Object.keys(
  ASSESSMENT_FIELD_KINDS,
) as AssessmentField[];

/**
 * The current purpose of the conversation. These are not question steps: the
 * engine derives the stage from the assessment after every turn.
 */
export const ADVISOR_STAGES = [
  "greeting",
  "understanding",
  "qualifying",
  "estimating",
  "contact",
  "complete",
  "human_handoff",
  "closed",
] as const;

export type AdvisorStage = (typeof ADVISOR_STAGES)[number];

/**
 * The controlled set of things the advisor can try to learn or do next. The
 * planner ranks them from the assessment; the AI picks one and phrases it.
 */
export const ADVISOR_GOALS = [
  "identify_issue",
  "determine_urgency",
  "locate_leak",
  "determine_active_leak",
  "determine_start_time",
  "determine_storm_damage",
  "determine_visible_damage",
  "determine_exposed_roof",
  "determine_interior_damage",
  "determine_replacement_reason",
  "determine_repair_scope",
  "determine_inspection_reason",
  "request_photo",
  "determine_roof_age",
  "determine_roof_material",
  "determine_roof_size",
  "determine_stories",
  "determine_replacement_interest",
  "confirm_detail",
  "offer_estimate",
  "provide_estimate",
  "determine_contact",
  "determine_phone",
  "determine_address",
  "determine_contact_preference",
  "human_handoff",
  "wrap_up",
  "close",
] as const;

export type AdvisorGoal = (typeof ADVISOR_GOALS)[number];

/** Company questions the advisor never answers from its own knowledge. */
export const POLICY_TOPICS = [
  "insurance",
  "financing",
  "service_area",
  "availability",
  "hours",
  "warranty",
  "licensing",
  "experience",
  "inspection_fee",
] as const;

export type PolicyTopic = (typeof POLICY_TOPICS)[number];

export type AdvisorMessageRole = "advisor" | "user";

export interface AdvisorAttachment {
  id: string;
  kind: "photo";
  name: string;
  content_type: string;
  size: number;
  /** Where the file lives in storage, once uploaded. */
  storage_path: string | null;
}

export interface AdvisorMessage {
  id: string;
  role: AdvisorMessageRole;
  content: string;
  created_at: string;
  /** For advisor messages: the goal the question served. */
  goal?: AdvisorGoal | null;
  attachments?: AdvisorAttachment[];
}

/**
 * What every AI turn produces. The UI consumes `reply`, `suggestions`,
 * `request_photo`, `show_estimate` and `handoff`; the application consumes
 * the rest. Flags are requests: the engine makes the final decision.
 */
export type AdvisorAIResponse = {
  reply: string;
  intent?: RoofingAssessment["intent"];
  updates?: Partial<RoofingAssessment>;
  confidence?: Record<string, number>;
  next_goal?: string;
  suggestions?: string[];
  request_photo?: boolean;
  request_contact?: boolean;
  show_estimate?: boolean;
  handoff?: boolean;
  handoff_reason?: string;
  conversation_complete?: boolean;
};

export type EstimateInput = {
  intent: string;
  /** Roof surface area in square feet. */
  roof_size?: number;
  /** Living area in square feet. */
  home_size?: number;
  roof_material?: string;
  roof_age?: number;
  stories?: number;
  damage_level?: string;
  repair_scope?: string;
};

export type EstimateResult = {
  low: number;
  high: number;
  currency: string;
  confidence: "low" | "medium" | "high";
  assumptions: string[];
};

export type EstimateFocus = "replacement" | "repair";

/** A detail the homeowner changed in a way that would move the estimate. */
export interface PendingConfirmation {
  field: "roof_age" | "roof_material" | "home_size" | "roof_size" | "stories";
  previous: string | number;
  latest: string | number;
}

/**
 * Conversation bookkeeping kept beside the assessment: what has been asked,
 * what the homeowner doesn't know, and where the conversation stands.
 */
export interface AdvisorContext {
  stage: AdvisorStage;
  /** Homeowner messages processed so far. */
  turn: number;
  /** How sure the extraction is about each field (0–1), plus "intent". */
  confidence: Partial<Record<AssessmentField | "intent", number>>;
  /** Fields the homeowner doesn't know or chose not to share. Never asked again. */
  unknown: AssessmentField[];
  /** How many times each goal has been asked. */
  asked: Partial<Record<AdvisorGoal, number>>;
  /** The goal behind the advisor's latest question. */
  last_goal: AdvisorGoal | null;
  /** Fields changed by the latest homeowner message, for bare corrections like "Actually, two weeks." */
  recent_fields: AssessmentField[];
  pending_confirmation: PendingConfirmation | null;
  estimate: {
    offered: boolean;
    requested: boolean;
    declined: boolean;
    shown: boolean;
    /** What the homeowner asked to price, when it differs from the conversation ("what would a new roof cost?"). */
    focus: EstimateFocus | null;
  };
  handoff_requested: boolean;
  callback_requested: boolean;
  emergency: boolean;
  /** Urgency in the homeowner's own words ("no rush", "ASAP"). Urgency itself is derived. */
  stated_urgency: AdvisorUrgency | null;
  /** Company questions to pass to the team. */
  team_questions: PolicyTopic[];
  contact_declined: boolean;
  completed: boolean;
  closed: boolean;
}

/** POST /api/roofing-advisor/message */
export interface AdvisorMessageRequest {
  conversationId: string;
  /** The homeowner's message id, generated by the client. */
  messageId?: string;
  message: string;
  assessment: RoofingAssessment;
  history: AdvisorMessage[];
  context?: AdvisorContext;
  attachments?: AdvisorAttachment[];
}

export interface AdvisorMessageResponse {
  response: AdvisorAIResponse;
  assessment: RoofingAssessment;
  context: AdvisorContext;
  /** The advisor's reply, ready to append to the conversation. */
  message: AdvisorMessage;
  /** Set when this turn shows a preliminary estimate. */
  estimate: EstimateResult | null;
}

/** POST /api/roofing-advisor/photos */
export interface AdvisorPhotoUploadResponse {
  photos: AdvisorAttachment[];
}
