import { runAdvisorTurn, type AdvisorTurnResult } from "../engine";
import { greetingFor } from "../opening";
import type { RoofingAdvisorProvider } from "../provider";
import { createAssessment, createContext } from "../state";
import type { AdvisorAttachment, AdvisorContext, AdvisorMessage, RoofingAssessment } from "../types";

export const FIXED_NOW = new Date("2026-09-24T15:00:00Z");

export interface Conversation {
  say(message: string, attachments?: AdvisorAttachment[]): Promise<AdvisorTurnResult>;
  readonly assessment: RoofingAssessment;
  readonly context: AdvisorContext;
  readonly history: AdvisorMessage[];
  /** Every advisor reply so far, greeting included. */
  replies(): string[];
}

/** Runs a conversation through the engine the way the chat UI does. */
export function startConversation(
  options: { conversationId?: string; provider?: RoofingAdvisorProvider | null } = {},
): Conversation {
  const conversationId = options.conversationId ?? "5f0c5a8e-3b7a-4c1e-9d2f-0a1b2c3d4e5f";
  let assessment = createAssessment();
  let context = createContext();
  let counter = 0;
  const history: AdvisorMessage[] = [
    {
      id: "greeting",
      role: "advisor",
      content: greetingFor(conversationId),
      created_at: FIXED_NOW.toISOString(),
      goal: "identify_issue",
    },
  ];

  return {
    async say(message, attachments) {
      const result = await runAdvisorTurn(
        { conversationId, message, attachments, history: [...history], assessment, context },
        { now: FIXED_NOW, createId: () => `msg-${++counter}`, provider: options.provider ?? null },
      );
      history.push(result.userMessage, result.advisorMessage);
      assessment = result.assessment;
      context = result.context;
      return result;
    },
    get assessment() {
      return assessment;
    },
    get context() {
      return context;
    },
    history,
    replies: () => history.filter((message) => message.role === "advisor").map((message) => message.content),
  };
}

export function photo(id = "photo-1"): AdvisorAttachment {
  return { id, kind: "photo", name: "roof.jpg", content_type: "image/jpeg", size: 120_000, storage_path: null };
}
