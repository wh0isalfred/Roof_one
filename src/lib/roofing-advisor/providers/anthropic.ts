import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  ADVISOR_RESPONSE_SCHEMA,
  ADVISOR_SYSTEM_PROMPT,
  renderAdvisorState,
  renderHomeownerMessage,
} from "../prompts";
import { AdvisorProviderError, type AdvisorInput, type RoofingAdvisorProvider } from "../provider";
import type { AdvisorAIResponse } from "../types";
import { extractJson, parseAdvisorAIResponse } from "../validation";

/*
 * Claude as the Roofing Advisor's understanding and voice. Server-only: the
 * API key never reaches the browser, and UI code never imports this file.
 */

export const DEFAULT_ADVISOR_MODEL = "claude-opus-5";

/** Models that accept Anthropic's server-side refusal fallback. */
const FALLBACK_MODELS = new Set(["claude-opus-5", "claude-fable-5", "claude-fable-5-1"]);

const HISTORY_LIMIT = 30;

export interface AnthropicProviderOptions {
  client: Anthropic;
  model?: string;
  /** A chat turn has to feel instant: give up early and let the local advisor answer. */
  timeoutMs?: number;
}

type MessageParam = Anthropic.Beta.BetaMessageParam;

/** The conversation as alternating turns, ending with this turn's state and message. */
export function buildMessages(input: AdvisorInput): MessageParam[] {
  const messages: MessageParam[] = [
    { role: "user", content: "(The homeowner opened the Roofing Advisor chat.)" },
  ];
  for (const message of input.history.slice(-HISTORY_LIMIT)) {
    const photos = message.attachments?.length ?? 0;
    const text =
      message.role === "user"
        ? `${photos > 0 ? `[Shared ${photos === 1 ? "a photo" : `${photos} photos`}.] ` : ""}${message.content}`
        : message.content;
    if (!text.trim()) continue;
    messages.push({ role: message.role === "user" ? "user" : "assistant", content: text });
  }
  messages.push({
    role: "user",
    content: [
      { type: "text", text: renderAdvisorState(input) },
      { type: "text", text: renderHomeownerMessage(input) },
    ],
  });
  return messages;
}

function supportsEffort(model: string): boolean {
  return !/haiku|sonnet-4-5|opus-4-1/.test(model);
}

function mentionsOutputFormat(error: unknown): boolean {
  return error instanceof Anthropic.BadRequestError && /output_config|format|schema/i.test(error.message);
}

export class AnthropicAdvisorProvider implements RoofingAdvisorProvider {
  readonly name = "anthropic";
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly timeoutMs: number;
  /** Set if the API ever rejects the output schema; JSON is then enforced by the prompt and validation. */
  private structuredOutputs = true;

  constructor({ client, model = DEFAULT_ADVISOR_MODEL, timeoutMs = 12_000 }: AnthropicProviderOptions) {
    this.client = client;
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  async respond(input: AdvisorInput): Promise<AdvisorAIResponse> {
    let message: Anthropic.Beta.BetaMessage;
    try {
      message = await this.request(input, this.structuredOutputs);
    } catch (error) {
      if (!this.structuredOutputs || !mentionsOutputFormat(error)) {
        throw new AdvisorProviderError("request_failed", { cause: error });
      }
      this.structuredOutputs = false;
      try {
        message = await this.request(input, false);
      } catch (retryError) {
        throw new AdvisorProviderError("request_failed", { cause: retryError });
      }
    }

    if (message.stop_reason === "refusal") throw new AdvisorProviderError("refusal");
    if (message.stop_reason === "max_tokens") throw new AdvisorProviderError("truncated");

    const text = message.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
    let json: unknown;
    try {
      json = extractJson(text);
    } catch (error) {
      throw new AdvisorProviderError("invalid_json", { cause: error });
    }
    const parsed = parseAdvisorAIResponse(json);
    if (!parsed.ok) throw new AdvisorProviderError(`invalid_response: ${parsed.errors.join(" ")}`);
    return parsed.value;
  }

  private request(input: AdvisorInput, structured: boolean): Promise<Anthropic.Beta.BetaMessage> {
    const fallbacks = FALLBACK_MODELS.has(this.model);
    return this.client.beta.messages.create(
      {
        model: this.model,
        max_tokens: 4096,
        // Fixed, so it caches across every conversation.
        system: [{ type: "text", text: ADVISOR_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: buildMessages(input),
        output_config: {
          // Chat is latency-sensitive; short replies don't need deep deliberation.
          ...(supportsEffort(this.model) ? { effort: "low" as const } : {}),
          ...(structured ? { format: { type: "json_schema" as const, schema: ADVISOR_RESPONSE_SCHEMA } } : {}),
        },
        ...(fallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      },
      { timeout: this.timeoutMs, maxRetries: 1 },
    );
  }
}
