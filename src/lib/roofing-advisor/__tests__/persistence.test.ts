import { describe, expect, it } from "vitest";
import { type AdvisorEvent, onAdvisorEvent } from "../events";
import { greetingFor } from "../opening";
import { processAdvisorMessage } from "../service";
import { createAssessment, createContext } from "../state";
import { MemoryAdvisorStore } from "../store/memory";
import type { AdvisorContext, AdvisorMessage, RoofingAssessment } from "../types";

/** Drives conversations through the same service the API route uses. */
function client(store: MemoryAdvisorStore) {
  const conversationId = crypto.randomUUID();
  let assessment: RoofingAssessment = createAssessment();
  let context: AdvisorContext = createContext();
  const history: AdvisorMessage[] = [
    {
      id: crypto.randomUUID(),
      role: "advisor",
      content: greetingFor(conversationId),
      created_at: new Date(Date.now() - 60_000).toISOString(),
      goal: "identify_issue",
    },
  ];
  return {
    conversationId,
    async say(message: string) {
      const { body, commit } = await processAdvisorMessage(
        { conversationId, messageId: crypto.randomUUID(), message, assessment, context, history: [...history], attachments: [] },
        { provider: null, store },
      );
      await commit();
      history.push({ id: crypto.randomUUID(), role: "user", content: message, created_at: new Date().toISOString() }, body.message);
      assessment = body.assessment;
      context = body.context;
      return body;
    },
  };
}

describe("lead creation (spec §47)", () => {
  it("creates one lead per conversation, then keeps it current", async () => {
    const store = new MemoryAdvisorStore();
    const events: AdvisorEvent[] = [];
    const stop = onAdvisorEvent((event) => {
      events.push(event);
    });

    const chat = client(store);
    for (const message of [
      "There's water coming through my bedroom ceiling whenever it rains.",
      "About two weeks ago",
      "No",
      "Nothing I can see",
      "I don't have one right now",
      "Maybe 12 years",
      "Sarah Jones",
    ]) {
      await chat.say(message);
    }
    expect(store.leadCount()).toBe(0);

    await chat.say("555-555-0134");
    expect(store.leadCount()).toBe(1);
    const lead = store.leadFor(chat.conversationId);
    expect(lead).toMatchObject({ name: "Sarah Jones", phone: "(555) 555-0134", issue_type: "leak", roof_age: "10_to_20" });
    expect(lead?.description).toMatch(/Preliminary range shown/);

    await chat.say("418 Maple Ave, Springfield, IL 62704");
    await chat.say("Text is fine");
    expect(store.leadCount()).toBe(1);
    expect(store.leadFor(chat.conversationId)).toMatchObject({ zip_code: "62704", preferred_contact_method: "text" });

    const types = events.filter((event) => event.conversation_id === chat.conversationId).map((event) => event.type);
    expect(types.filter((type) => type === "LEAD_CREATED")).toHaveLength(1);
    expect(types).toEqual(expect.arrayContaining(["ESTIMATE_GENERATED", "CONTACT_SUBMITTED", "ASSESSMENT_COMPLETED"]));
    expect(events.find((event) => event.type === "ASSESSMENT_COMPLETED")?.lead_id).toBe(lead?.id);
    stop();
  });

  it("doesn't duplicate a lead when the same turn is saved twice", async () => {
    const store = new MemoryAdvisorStore();
    const record = {
      conversationId: crypto.randomUUID(),
      stage: "contact" as const,
      messages: [],
      assessment: createAssessment(),
      confidence: {},
      estimate: null,
      completeness: {},
      events: [],
      lead: { name: "Dana", phone: "(555) 555-0199", issue_type: "leak" as const },
    };
    const [first, second] = await Promise.all([store.saveTurn(record), store.saveTurn(record)]);
    expect(store.leadCount()).toBe(1);
    expect(first.leadId).toBe(second.leadId);
    expect([first.leadCreated, second.leadCreated].filter(Boolean)).toHaveLength(1);
  });

  it("keeps the whole conversation, greeting included", async () => {
    const store = new MemoryAdvisorStore();
    const chat = client(store);
    await chat.say("My roof leaks.");
    await chat.say("Kitchen");
    const messages = store.messagesFor(chat.conversationId);
    expect(messages.map((message) => message.role)).toEqual(["advisor", "user", "advisor", "user", "advisor"]);
    expect(store.conversation(chat.conversationId)?.stage).toBe("qualifying");
  });
});
