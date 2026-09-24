import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { AnthropicAdvisorProvider } from "../providers/anthropic";
import type { AdvisorAIResponse } from "../types";
import { startConversation } from "./harness";

interface CapturedRequest {
  url: string;
  headers: Headers;
  body: Record<string, unknown>;
}

type Reply = { status?: number; body: unknown };

/** An Anthropic client whose HTTP calls are answered in order by `replies`. */
function mockClient(replies: Reply[]) {
  const requests: CapturedRequest[] = [];
  const fetch = async (url: string | URL | Request, init?: RequestInit) => {
    requests.push({
      url: String(url),
      headers: new Headers(init?.headers),
      body: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>,
    });
    const reply = replies.shift();
    if (!reply) throw new Error("Unexpected request");
    return new Response(JSON.stringify(reply.body), {
      status: reply.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  };
  const client = new Anthropic({
    apiKey: "test-key",
    baseURL: "https://anthropic.test",
    fetch,
    maxRetries: 0,
  });
  return { client, requests };
}

function message(text: string, stopReason = "end_turn") {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-opus-5",
    content: [{ type: "text", text }],
    stop_reason: stopReason,
    stop_sequence: null,
    usage: { input_tokens: 100, output_tokens: 40 },
  };
}

const locateReply: AdvisorAIResponse = {
  reply: "Which room is that in?",
  intent: "leak",
  updates: { leak_location: "ceiling", active_leak: true },
  confidence: { intent: 0.95, leak_location: 0.9, active_leak: 0.7 },
  next_goal: "locate_leak",
  suggestions: ["Bedroom", "Kitchen", "Living room"],
  request_photo: false,
  request_contact: false,
  show_estimate: false,
  handoff: false,
  conversation_complete: false,
};

async function firstTurn(replies: Reply[]) {
  const { client, requests } = mockClient(replies);
  const provider = new AnthropicAdvisorProvider({ client, model: "claude-opus-5" });
  const conversation = startConversation({ provider });
  const result = await conversation.say("There's water coming through my ceiling.");
  return { result, requests };
}

describe("Anthropic provider", () => {
  it("sends a cached system prompt, the turn state and a JSON schema", async () => {
    const { result, requests } = await firstTurn([{ body: message(JSON.stringify(locateReply)) }]);

    expect(requests).toHaveLength(1);
    const [request] = requests;
    expect(request?.url).toBe("https://anthropic.test/v1/messages?beta=true");
    expect(request?.headers.get("x-api-key")).toBe("test-key");
    expect(request?.headers.get("anthropic-beta")).toContain("server-side-fallback-2026-07-01");

    const body = request?.body ?? {};
    expect(body.model).toBe("claude-opus-5");
    expect(body.fallbacks).toBe("default");
    expect(body.system).toEqual([
      expect.objectContaining({ type: "text", cache_control: { type: "ephemeral" } }),
    ]);
    expect(body.output_config).toEqual({
      effort: "low",
      format: expect.objectContaining({ type: "json_schema" }),
    });

    const messages = body.messages as Array<{ role: string; content: unknown }>;
    expect(messages[0]?.role).toBe("user");
    const last = JSON.stringify(messages.at(-1));
    expect(last).toContain("<advisor_state>");
    expect(last).toContain("<homeowner_message>There's water coming through my ceiling.</homeowner_message>");

    expect(result.source).toBe("anthropic");
    expect(result.response.reply).toBe("Which room is that in?");
    expect(result.assessment.leak_location).toBe("ceiling");
  });

  it("retries without the schema when the API rejects it", async () => {
    const { result, requests } = await firstTurn([
      {
        status: 400,
        body: { type: "error", error: { type: "invalid_request_error", message: "output_config.format: schema is too complex" } },
      },
      { body: message(`Here you go: ${JSON.stringify(locateReply)}`) },
    ]);

    expect(requests).toHaveLength(2);
    expect((requests[1]?.body.output_config as Record<string, unknown>).format).toBeUndefined();
    expect(result.source).toBe("anthropic");
  });

  it("falls back to the local advisor on invalid JSON", async () => {
    const { result } = await firstTurn([{ body: message("Which room is it in?") }]);
    expect(result.source).toBe("local");
    expect(result.response.next_goal).toBe("locate_leak");
  });

  it("falls back on a refusal", async () => {
    const { result } = await firstTurn([{ body: message("", "refusal") }]);
    expect(result.source).toBe("local");
  });

  it("falls back when the API errors", async () => {
    const { result } = await firstTurn([
      { status: 500, body: { type: "error", error: { type: "api_error", message: "Overloaded" } } },
    ]);
    expect(result.source).toBe("local");
  });

  it("rejects a reply that states a price", async () => {
    const { result } = await firstTurn([
      { body: message(JSON.stringify({ ...locateReply, reply: "Leaks like this run about $900. Which room?" })) },
    ]);
    expect(result.source).toBe("local");
    expect(result.response.reply).not.toMatch(/\$/);
  });

  it("rejects a question about something already known", async () => {
    const { result } = await firstTurn([
      { body: message(JSON.stringify({ ...locateReply, reply: "What's going on with the roof?", next_goal: "identify_issue" })) },
    ]);
    expect(result.source).toBe("local");
  });

  it("rejects extra keys in the JSON", async () => {
    const { result } = await firstTurn([{ body: message(JSON.stringify({ ...locateReply, mood: "helpful" })) }]);
    expect(result.source).toBe("local");
  });
});
