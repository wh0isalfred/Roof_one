import "server-only";
import { runAdvisorTurn } from "./engine";
import { emitAdvisorEvents } from "./events";
import { estimateFromAssessment } from "./pricing";
import { AdvisorProviderError, type RoofingAdvisorProvider } from "./provider";
import type { AdvisorStore, AdvisorTurnRecord } from "./store/types";
import type { AdvisorMessage, AdvisorMessageRequest, AdvisorMessageResponse } from "./types";
import { isUuid } from "./validation";

/*
 * One advisor turn for the API route: run the engine, answer right away, and
 * hand back the persistence work to run after the response is sent.
 */

export interface ProcessedTurn {
  body: AdvisorMessageResponse;
  /** Saves the turn, creates or updates the lead, and emits events. */
  commit: () => Promise<void>;
}

/** Advisor messages sent since the homeowner's last message: usually just the question being answered. */
function unsavedAdvisorMessages(history: readonly AdvisorMessage[], before: string): AdvisorMessage[] {
  const lastUser = history.findLastIndex((message) => message.role === "user");
  const cutoff = new Date(new Date(before).getTime() - 1).toISOString();
  return history
    .slice(lastUser + 1)
    .filter((message) => message.role === "advisor" && isUuid(message.id))
    .map((message) => ({
      ...message,
      // Browser clocks drift; keep the question before the answer.
      created_at: message.created_at < cutoff ? message.created_at : cutoff,
    }));
}

function describeError(error: unknown): string {
  if (error instanceof AdvisorProviderError) return error.reason;
  if (error instanceof Error) return error.name;
  return "unknown error";
}

export async function processAdvisorMessage(
  request: Required<Omit<AdvisorMessageRequest, "messageId">> & { messageId: string | null },
  deps: { provider: RoofingAdvisorProvider | null; store: AdvisorStore },
): Promise<ProcessedTurn> {
  const result = await runAdvisorTurn(
    {
      conversationId: request.conversationId,
      messageId: request.messageId,
      message: request.message,
      attachments: request.attachments,
      history: request.history,
      assessment: request.assessment,
      context: request.context,
    },
    {
      provider: deps.provider,
      // Never log the conversation itself: it holds names, numbers and addresses.
      onProviderError: (error) =>
        console.warn(`Roofing Advisor: AI provider failed (${describeError(error)}); the local advisor answered.`),
      onProviderRejected: (errors) =>
        console.warn(`Roofing Advisor: AI reply rejected (${errors.join(" ")}); the local advisor answered.`),
    },
  );

  const body: AdvisorMessageResponse = {
    response: result.response,
    assessment: result.assessment,
    context: result.context,
    message: result.advisorMessage,
    estimate: result.estimate,
  };

  const commit = async () => {
    const current = result.context.estimate.shown
      ? estimateFromAssessment(result.assessment, result.context.estimate.focus)
      : null;
    const record: AdvisorTurnRecord = {
      conversationId: request.conversationId,
      stage: result.context.stage,
      messages: [
        ...unsavedAdvisorMessages(request.history, result.userMessage.created_at),
        result.userMessage,
        result.advisorMessage,
      ],
      assessment: result.assessment,
      confidence: result.context.confidence,
      estimate: current,
      completeness: result.completeness,
      events: result.events,
      lead: result.lead,
    };
    const saved = await deps.store.saveTurn(record);
    await emitAdvisorEvents(saved.events);
  };

  return { body, commit };
}
