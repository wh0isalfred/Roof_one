import { diffAssessment } from "../assessment";
import { CONTACT_GOALS } from "../goals";
import { composeReply } from "../phrasing";
import type { AdvisorInput, RoofingAdvisorProvider } from "../provider";
import type { AdvisorAIResponse } from "../types";

/**
 * The advisor without an AI model: deterministic understanding plus varied,
 * goal-based wording. It's the fallback whenever the AI provider is missing,
 * slow or returns something invalid, so the chat always works.
 */
export class LocalAdvisorProvider implements RoofingAdvisorProvider {
  readonly name = "local";

  async respond(input: AdvisorInput): Promise<AdvisorAIResponse> {
    const { plan, draft, previous } = input;
    const phrased = composeReply({
      seed: input.seed,
      assessment: draft.assessment,
      previous: previous.assessment,
      context: draft.context,
      previousContext: previous.context,
      analysis: input.analysis,
      plan,
      changed: input.changed,
      lastAdvisorReply: [...input.history].reverse().find((message) => message.role === "advisor")?.content ?? null,
      business: input.business,
    });

    const updates = diffAssessment(previous.assessment, draft.assessment);
    const confidence: Record<string, number> = {};
    for (const field of Object.keys(updates)) {
      const value = draft.context.confidence[field as keyof typeof draft.context.confidence];
      if (value !== undefined) confidence[field] = value;
    }

    const goal = plan.close ? "close" : plan.handoff ? "human_handoff" : (plan.next?.goal ?? "wrap_up");
    return {
      reply: phrased.reply,
      intent: draft.assessment.intent,
      updates,
      confidence,
      next_goal: goal,
      suggestions: phrased.suggestions,
      request_photo: goal === "request_photo",
      request_contact: CONTACT_GOALS.has(goal),
      show_estimate: plan.showEstimate,
      handoff: plan.handoff,
      ...(plan.handoff ? { handoff_reason: "Homeowner asked for a person." } : {}),
      conversation_complete: plan.complete || plan.close,
    };
  }
}
