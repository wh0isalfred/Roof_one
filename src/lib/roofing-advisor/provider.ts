import type { AdvisorBusinessConfig } from "@/config/advisor";
import type { AdvisorState } from "./assessment";
import type { MessageAnalysis } from "./extraction";
import type { GoalPlan } from "./goals";
import type {
  AdvisorAIResponse,
  AdvisorAttachment,
  AdvisorMessage,
  AssessmentField,
  EstimateResult,
} from "./types";

/**
 * Everything a provider gets for one turn: the conversation, the state before
 * and after deterministic extraction, and the ranked goals it may pursue.
 */
export interface AdvisorInput {
  conversationId: string;
  message: string;
  attachments: readonly AdvisorAttachment[];
  history: readonly AdvisorMessage[];
  /** State before this message. */
  previous: AdvisorState;
  /** State after the deterministic reading of this message. */
  draft: AdvisorState;
  changed: readonly AssessmentField[];
  analysis: MessageAnalysis;
  plan: GoalPlan;
  /** The range the app will show if the plan shows an estimate this turn. */
  estimate: EstimateResult | null;
  business: AdvisorBusinessConfig;
  /** Stable per turn, for varied but reproducible wording. */
  seed: string;
}

/**
 * Where a turn's wording and understanding come from. Swap providers (another
 * model, another vendor) without touching the engine or the UI.
 */
export interface RoofingAdvisorProvider {
  readonly name: string;
  respond(input: AdvisorInput): Promise<AdvisorAIResponse>;
}

export class AdvisorProviderError extends Error {
  constructor(
    readonly reason: string,
    options?: { cause?: unknown },
  ) {
    super(`Roofing Advisor provider failed: ${reason}`, options);
    this.name = "AdvisorProviderError";
  }
}
