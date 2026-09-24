import { describe, expect, it } from "vitest";
import { ADVISOR_RESPONSE_SCHEMA } from "../prompts";
import {
  parseAdvisorAIResponse,
  parseMessageRequest,
  reviewReply,
  sanitizeAssessment,
  sanitizeContext,
} from "../validation";

const valid = {
  reply: "Where's the water coming through?",
  intent: "leak",
  updates: { active_leak: true },
  confidence: { intent: 0.98, active_leak: 0.91 },
  next_goal: "locate_leak",
  suggestions: ["Ceiling", "Wall", "Around a window", "Somewhere else"],
  request_photo: false,
  request_contact: false,
  show_estimate: false,
  handoff: false,
  conversation_complete: false,
};

describe("the AI response contract (spec §39)", () => {
  it("accepts the spec's example", () => {
    const result = parseAdvisorAIResponse(valid);
    expect(result.ok).toBe(true);
  });

  it("rejects extra keys, unknown fields and bad values", () => {
    expect(parseAdvisorAIResponse({ ...valid, mood: "happy" }).ok).toBe(false);
    expect(parseAdvisorAIResponse({ ...valid, updates: { favorite_color: "blue" } }).ok).toBe(false);
    expect(parseAdvisorAIResponse({ ...valid, updates: { roof_age: "twelve" } }).ok).toBe(false);
    expect(parseAdvisorAIResponse({ ...valid, next_goal: "sell_gutters" }).ok).toBe(false);
    expect(parseAdvisorAIResponse({ ...valid, confidence: { roof_age: 7 } }).ok).toBe(false);
    expect(parseAdvisorAIResponse({ ...valid, reply: "" }).ok).toBe(false);
    expect(parseAdvisorAIResponse("Where's the water?").ok).toBe(false);
  });

  it("normalizes contact details and drops invalid ones", () => {
    expect(parseAdvisorAIResponse({ ...valid, updates: { phone: "555 555 0134" } })).toMatchObject({
      ok: true,
      value: { updates: { phone: "(555) 555-0134" } },
    });
    expect(parseAdvisorAIResponse({ ...valid, updates: { email: "not-an-email" } }).ok).toBe(false);
  });

  it("describes the same shape as a JSON schema", () => {
    const properties = ADVISOR_RESPONSE_SCHEMA.properties as Record<string, unknown>;
    expect(Object.keys(properties).sort()).toEqual(Object.keys({ ...valid, handoff_reason: "" }).sort());
    expect(ADVISOR_RESPONSE_SCHEMA.additionalProperties).toBe(false);
  });
});

describe("reply guardrails", () => {
  const options = { answeringQuestion: false, previousReply: null, configuredPolicies: [] };

  it.each([
    "Thank you for providing that information. Where is it leaking?",
    "Based on the information you provided, it could be flashing.",
    "As an AI, I can't see your roof.",
    "Could you please provide your address?",
    "That repair usually runs about $1,200.",
    "Most replacements cost 15k or so.",
    "We offer financing on every roof.",
    "Someone will be out there within an hour.",
    "It's definitely the flashing around your chimney.",
    "How old is it? What's it made of? How big is the house?",
  ])("rejects %j", (reply) => {
    expect(reviewReply(reply, options).ok).toBe(false);
  });

  it("accepts short, natural replies", () => {
    expect(reviewReply("Still leaking?", options)).toEqual({ ok: true, value: "Still leaking?" });
    expect(reviewReply("About 1,500 sq ft works. How many stories?", options).ok).toBe(true);
  });

  it("drops a repeated opener instead of saying it twice", () => {
    const result = reviewReply("Got it. When did it start?", { ...options, previousReply: "Got it. Where is it?" });
    expect(result).toEqual({ ok: true, value: "When did it start?" });
  });

  it("allows a longer answer when they asked a question", () => {
    const answer =
      "Asphalt shingles often last around 20 to 30 years, depending on the climate, the attic ventilation and how well the roof was installed in the first place. Metal and tile usually last a good deal longer than that. Want me to work out a rough range for yours?";
    expect(reviewReply(answer, options).ok).toBe(false);
    expect(reviewReply(answer, { ...options, answeringQuestion: true }).ok).toBe(true);
  });
});

describe("requests from the browser", () => {
  it("requires a UUID conversation and a message or photo", () => {
    expect(parseMessageRequest({ conversationId: "abc", message: "hi" }).ok).toBe(false);
    expect(parseMessageRequest({ conversationId: crypto.randomUUID(), message: "  " }).ok).toBe(false);
    expect(
      parseMessageRequest({
        conversationId: crypto.randomUUID(),
        message: "",
        attachments: [{ id: "p1", kind: "photo", name: "a.jpg", content_type: "image/jpeg", size: 1 }],
      }).ok,
    ).toBe(true);
  });

  it("cleans up untrusted state instead of trusting it", () => {
    const assessment = sanitizeAssessment({ roof_age: "old", intent: "hack", leak_location: "  bedroom  ", extra: 1 });
    expect(assessment.roof_age).toBeNull();
    expect(assessment.intent).toBeNull();
    expect(assessment.leak_location).toBe("bedroom");
    expect("extra" in assessment).toBe(false);

    const context = sanitizeContext({ turn: -3, asked: { locate_leak: 1, hack: 5 }, unknown: ["roof_age", "nope"] });
    expect(context.turn).toBe(0);
    expect(context.asked).toEqual({ locate_leak: 1 });
    expect(context.unknown).toEqual(["roof_age"]);
  });
});
