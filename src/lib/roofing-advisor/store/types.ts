import type { NewLead } from "@/lib/leads/types";
import type { AdvisorEvent } from "../events";
import type {
  AdvisorAttachment,
  AdvisorContext,
  AdvisorMessage,
  AdvisorStage,
  EstimateResult,
  RoofingAssessment,
} from "../types";

/** Mirrors the advisor_conversation_status enum in supabase/migrations. */
export const ADVISOR_CONVERSATION_STATUSES = ["active", "handoff", "complete", "closed"] as const;
export type AdvisorConversationStatus = (typeof ADVISOR_CONVERSATION_STATUSES)[number];

export function conversationStatus(stage: AdvisorStage): AdvisorConversationStatus {
  switch (stage) {
    case "human_handoff":
      return "handoff";
    case "complete":
      return "complete";
    case "closed":
      return "closed";
    default:
      return "active";
  }
}

/** Everything one turn writes. Saving the same turn twice changes nothing. */
export interface AdvisorTurnRecord {
  conversationId: string;
  stage: AdvisorStage;
  /** New messages, keyed by id so retries don't duplicate them. */
  messages: AdvisorMessage[];
  assessment: RoofingAssessment;
  confidence: AdvisorContext["confidence"];
  estimate: EstimateResult | null;
  completeness: Record<string, boolean>;
  events: AdvisorEvent[];
  /** Present once there's someone to contact. Creates the lead once, then updates it. */
  lead: NewLead | null;
}

export interface SavedTurn {
  leadId: string | null;
  /** True only on the turn that created the lead. */
  leadCreated: boolean;
  /** The turn's events, plus LEAD_CREATED when this turn created the lead. */
  events: AdvisorEvent[];
}

export interface PhotoUpload {
  id: string;
  name: string;
  contentType: string;
  data: ArrayBuffer;
}

/**
 * Where conversations, assessments and leads are kept. Supabase in
 * production; memory when it isn't configured.
 */
export interface AdvisorStore {
  readonly name: string;
  /** False when data doesn't outlive the server process. */
  readonly durable: boolean;
  saveTurn(record: AdvisorTurnRecord): Promise<SavedTurn>;
  savePhoto(conversationId: string, photo: PhotoUpload): Promise<AdvisorAttachment>;
}
