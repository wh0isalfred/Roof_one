import { describe, expect, it } from "vitest";
import { hasUsefulLocation } from "../assessment";
import type { AdvisorTurnResult } from "../engine";
import { goalFields } from "../extraction";
import { isQualifyingGoal } from "../goals";
import { isKnown } from "../state";
import type { AdvisorGoal, RoofingAssessment } from "../types";
import { BANNED_PHRASES } from "../validation";
import { type Conversation, photo, startConversation } from "./harness";

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** Every reply keeps the voice: no AI or call-center phrasing, no prices, one question at most. */
function expectNatural(reply: string) {
  for (const pattern of BANNED_PHRASES) expect(reply).not.toMatch(pattern);
  expect(reply).not.toMatch(/\$|\bdollars?\b/i);
  expect((reply.match(/\?/g) ?? []).length).toBeLessThanOrEqual(1);
  expect(reply).not.toMatch(/\*\*|^#/m);
}

/** The advisor never asks for something it already knows. */
function expectNewQuestion(before: RoofingAssessment, result: AdvisorTurnResult) {
  const goal = result.response.next_goal as AdvisorGoal | undefined;
  // Confirming a guess ("Still leaking?", "Is it asphalt shingle?") or narrowing "ceiling" to a room is fine.
  if (!goal || !isQualifyingGoal(goal) || goal === "determine_active_leak" || goal === "determine_roof_material") return;
  if (goal === "locate_leak" && !hasUsefulLocation(result.assessment.leak_location)) return;
  for (const field of goalFields(goal, before)) {
    if (field === "intent") continue;
    expect(isKnown(result.assessment, field), `${goal} asked for known ${field}`).toBe(false);
  }
}

async function say(conversation: Conversation, message: string, attachments?: Parameters<Conversation["say"]>[1]) {
  const before = conversation.assessment;
  const result = await conversation.say(message, attachments);
  expectNatural(result.response.reply);
  expectNewQuestion(before, result);
  return result;
}

describe("spec §51: conversation behavior", () => {
  it("understands a leak and asks where or whether it's still leaking", async () => {
    const conversation = startConversation();
    const result = await say(conversation, "Water is coming through my bedroom ceiling.");
    expect(result.assessment.intent).toBe("leak");
    expect(result.assessment.active_leak).toBe(true);
    expect(result.assessment.leak_location).toBe("bedroom ceiling");
    expect(["locate_leak", "determine_active_leak"]).toContain(result.response.next_goal);
    expect(words(result.response.reply)).toBeLessThanOrEqual(15);
  });

  it("extracts several facts from one message and doesn't ask for them again", async () => {
    const conversation = startConversation();
    const result = await say(conversation, "The roof is 12 years old and started leaking after last week's storm.");
    expect(result.assessment.roof_age).toBe(12);
    expect(result.assessment.storm_damage).toBe(true);
    expect(result.assessment.intent).toBe("leak");
    expect(result.assessment.storm_date).toBe("last week");
    expect(["determine_roof_age", "determine_storm_damage", "identify_issue", "determine_start_time"]).not.toContain(
      result.response.next_goal,
    );
  });

  it("doesn't force an intent when they don't know what's wrong", async () => {
    const conversation = startConversation();
    const result = await say(conversation, "I don't know what's wrong.");
    expect(result.assessment.intent).toBe("unknown");
    expect(result.response.next_goal).toBe("identify_issue");
    expect(result.response.reply).toMatch(/noticed/i);
  });

  it("accepts not knowing the roof's age and keeps going", async () => {
    const conversation = startConversation();
    const result = await say(conversation, "I have no idea how old it is.");
    expect(result.assessment.roof_age).toBeNull();
    expect(result.context.unknown).toContain("roof_age");
    expect(result.response.reply).toMatch(/^No (?:problem|worries)/);
    expect(result.response.next_goal).toBe("identify_issue");
    expect(result.response.conversation_complete).toBe(false);
  });

  it("never asks again for something they said they don't know", async () => {
    const conversation = startConversation();
    await say(conversation, "My roof leaks in the kitchen whenever it rains.");
    await say(conversation, "About two weeks ago.");
    await say(conversation, "No storms.");
    await say(conversation, "Nothing I can see.");
    let result = await say(conversation, "I don't have one right now");
    expect(result.response.next_goal).toBe("determine_roof_age");
    result = await say(conversation, "No idea.");
    expect(result.response.reply).toMatch(/^(?:No problem|No worries|That's okay)/);
    expect(result.context.unknown).toContain("roof_age");
    for (let turn = 0; turn < 4; turn += 1) {
      const next = await say(conversation, turn === 0 ? "Sam Rivera" : turn === 1 ? "555-555-0142" : "Not sure");
      expect(next.response.next_goal).not.toBe("determine_roof_age");
    }
  });

  it("takes a correction as the new value", async () => {
    const conversation = startConversation();
    await say(conversation, "It's been leaking for a month.");
    expect(conversation.assessment.issue_started).toBe("about a month ago");
    const result = await say(conversation, "Actually, two weeks.");
    expect(result.assessment.issue_started).toBe("about two weeks ago");
    expect(result.assessment.leak_location).toBeNull();
  });

  it("hands off to a person right away", async () => {
    const conversation = startConversation();
    const result = await say(conversation, "Can I just speak to someone?");
    expect(result.response.handoff).toBe(true);
    expect(result.context.stage).toBe("human_handoff");
    expect(result.response.reply).toMatch(/team/i);
    expect(result.events.map((event) => event.type)).toContain("HUMAN_REQUESTED");
  });

  it("lets them stop without persuading them", async () => {
    const conversation = startConversation();
    const result = await say(conversation, "Never mind.");
    expect(result.response.reply).toBe("No problem.");
    expect(result.context.stage).toBe("closed");
    expect(result.response.conversation_complete).toBe(true);
  });

  it("answers a price question without inventing a price, and offers a range", async () => {
    const conversation = startConversation();
    const result = await say(conversation, "How much is a new roof?");
    expect(result.response.reply).toMatch(/depends/i);
    expect(result.response.reply).not.toMatch(/\d/);
    expect(result.response.next_goal).toBe("offer_estimate");
    expect(result.response.show_estimate).toBe(false);
    expect(result.estimate).toBeNull();
  });

  it("redirects out-of-scope questions", async () => {
    const conversation = startConversation();
    const result = await say(conversation, "What's the weather?");
    expect(result.response.reply).toBe("I can help with the roof. What's going on?");
    expect(result.assessment.intent).toBeNull();
  });
});

describe("spec §52: the critical conversation", () => {
  it("runs naturally from the first message to the team", async () => {
    const conversation = startConversation();
    const steps: Array<[string, AdvisorGoal]> = [
      ["There's water coming through my ceiling.", "locate_leak"],
      ["Bedroom.", "determine_active_leak"],
      ["Only when it rains.", "determine_start_time"],
      ["After the storm last week.", "determine_visible_damage"],
      ["Yeah, I think a shingle is missing.", "request_photo"],
    ];
    for (const [message, goal] of steps) {
      const result = await say(conversation, message);
      expect(result.response.next_goal).toBe(goal);
    }

    const afterPhoto = await say(conversation, "", [photo()]);
    expect(afterPhoto.assessment.photos_uploaded).toBe(true);
    expect(afterPhoto.response.reply).toMatch(/^Thanks/);
    expect(afterPhoto.response.next_goal).toBe("determine_roof_age");
    expect(afterPhoto.events.map((event) => event.type)).toContain("PHOTO_UPLOADED");

    const estimate = await say(conversation, "Maybe 12 years.");
    expect(estimate.assessment.roof_age).toBe(12);
    expect(conversation.context.confidence.roof_age).toBeLessThan(0.8);
    expect(estimate.response.show_estimate).toBe(true);
    expect(estimate.estimate).not.toBeNull();
    expect(estimate.response.next_goal).toBe("determine_contact");

    const a = conversation.assessment;
    expect(a).toMatchObject({
      intent: "leak",
      leak_location: "bedroom ceiling",
      active_leak: true,
      leak_frequency: "only when it rains",
      storm_damage: true,
      storm_date: "last week",
      missing_shingles: true,
      interior_damage: true,
    });

    // Short, varied replies; no opener used twice in a row.
    const replies = conversation.replies();
    const lengths = replies.map(words).sort((x, y) => x - y);
    expect(lengths[Math.floor(lengths.length / 2)]).toBeLessThanOrEqual(10);
    const openers = replies.map((reply) => reply.split(/[.!?,]/)[0]);
    for (let index = 1; index < openers.length; index += 1) {
      expect(openers[index]).not.toBe(openers[index - 1]);
    }
    expect(replies.filter((reply) => reply.startsWith("Got it")).length).toBeLessThanOrEqual(1);
  });
});

describe("spec §53: the same leak said five ways", () => {
  it.each([
    "My roof leaks.",
    "There's water dripping from the ceiling.",
    "Every time it rains my bedroom gets wet.",
    "I think I have a leak.",
    "My ceiling has started staining.",
  ])("recognizes a leak in %j", async (message) => {
    const result = await say(startConversation(), message);
    expect(result.assessment.intent).toBe("leak");
    expect(result.response.next_goal).not.toBe("identify_issue");
  });
});

describe("spec §54: many facts at once", () => {
  it("extracts everything and asks the most useful missing thing", async () => {
    const result = await say(
      startConversation(),
      "The roof is about 15 years old, there was a storm two weeks ago, and now there's water coming into the living room whenever it rains.",
    );
    expect(result.assessment).toMatchObject({
      intent: "leak",
      roof_age: 15,
      storm_damage: true,
      storm_date: "two weeks ago",
      leak_location: "living room",
      active_leak: true,
      leak_frequency: "whenever it rains",
    });
    expect(result.response.next_goal).toBe("determine_visible_damage");
  });

  it("asks whether it's still leaking when that's what's missing (§19)", async () => {
    const result = await say(
      startConversation(),
      "It started leaking last week after the storm, it's in the kitchen and the roof is probably 10 years old.",
    );
    expect(result.assessment).toMatchObject({ leak_location: "kitchen", roof_age: 10, storm_damage: true });
    expect(result.assessment.issue_started).toMatch(/last week/);
    expect(result.response.next_goal).toBe("determine_active_leak");
  });
});

describe("flows by situation", () => {
  it("storm damage: understands the damage and prioritizes it over roof age (§13)", async () => {
    const conversation = startConversation();
    const result = await say(conversation, "We had a storm yesterday and half the shingles on the back look gone.");
    expect(result.assessment).toMatchObject({
      intent: "storm_damage",
      storm_damage: true,
      storm_date: "yesterday",
      missing_shingles: true,
      urgency: "high",
    });
    expect(result.assessment.visible_damage).toContain("large area of missing shingles");
    expect(result.response.next_goal).toBe("determine_active_leak");

    await say(conversation, "No, nothing inside");
    const exposed = await say(conversation, "Yes I can see some bare wood");
    expect(exposed.assessment.urgency).toBe("emergency");
    expect(exposed.response.next_goal).toBe("determine_contact");
  });

  it("replacement: asks why, then only what's still useful (§14)", async () => {
    const conversation = startConversation();
    let result = await say(conversation, "I think I need a full replacement.");
    expect(result.assessment.intent).toBe("replacement");
    expect(result.response.next_goal).toBe("determine_replacement_reason");
    result = await say(conversation, "It's about 20 years old and constantly needs repairs.");
    expect(result.assessment.roof_age).toBe(20);
    expect(result.assessment.current_condition).toMatch(/constantly needs repairs/);
    expect(result.response.next_goal).toBe("determine_active_leak");
  });

  it("repair: doesn't ask what's damaged when they've said (§15)", async () => {
    const result = await say(startConversation(), "I need a few shingles replaced.");
    expect(result.assessment.intent).toBe("repair");
    expect(result.response.next_goal).not.toBe("determine_repair_scope");
    expect(result.response.next_goal).not.toBe("determine_roof_age");
  });

  it("inspection: no estimate questionnaire (§16)", async () => {
    const conversation = startConversation();
    let result = await say(conversation, "I just want an inspection.");
    expect(result.response.reply).toMatch(/routine check/);
    result = await say(conversation, "Nothing really.");
    expect(result.response.next_goal).toBe("determine_contact");
    expect(result.response.show_estimate).toBe(false);
  });

  it("unknown problem: infers a leak from what they've noticed (§17)", async () => {
    const conversation = startConversation();
    await say(conversation, "I don't know what's wrong.");
    const result = await say(conversation, "There are dark spots on the ceiling.");
    expect(result.assessment.intent).toBe("leak");
    expect(result.assessment.interior_damage).toBe(true);
    expect(result.response.next_goal).toBe("locate_leak");
  });

  it("emergency: safety first, then gets the team involved", async () => {
    const result = await say(startConversation(), "Water is pouring through the ceiling right next to the light fixture!");
    expect(result.assessment.urgency).toBe("emergency");
    expect(result.response.reply).toMatch(/stay clear/i);
    expect(result.response.next_goal).toBe("determine_contact");
  });
});

describe("memory, corrections and conflicts", () => {
  it("replaces a corrected location instead of keeping both (§33)", async () => {
    const conversation = startConversation();
    await say(conversation, "It's leaking in the bedroom.");
    const result = await say(conversation, "Actually, it's the guest bedroom.");
    expect(result.assessment.leak_location).toBe("guest bedroom");
  });

  it("ignores the value they're correcting away from (§35)", async () => {
    const conversation = startConversation();
    await say(conversation, "My kitchen ceiling started leaking last week.");
    const result = await say(conversation, "Actually, it started three months ago, not last week.");
    expect(result.assessment.issue_started).toBe("three months ago");
  });

  it("double-checks a hedged change only when it moves the estimate (§36)", async () => {
    const conversation = startConversation();
    await say(conversation, "My roof leaks in the kitchen and it's 8 years old.");
    const result = await say(conversation, "Actually it's probably 15.");
    expect(result.assessment.roof_age).toBe(15);
    expect(result.response.next_goal).toBe("confirm_detail");
    expect(result.response.reply).toBe("Just to check — about 8 or 15 years?");
    const confirmed = await say(conversation, "15");
    expect(confirmed.assessment.roof_age).toBe(15);
    expect(confirmed.context.pending_confirmation).toBeNull();
    expect(confirmed.response.next_goal).not.toBe("confirm_detail");
  });

  it("takes the latest value without asking when it doesn't matter for price", async () => {
    const conversation = startConversation();
    await say(conversation, "I think I need a new roof. It's 10 years old.");
    const result = await say(conversation, "Actually it's probably 25.");
    expect(result.assessment.roof_age).toBe(25);
    expect(result.response.next_goal).not.toBe("confirm_detail");
  });
});

describe("interruptions, pricing and company questions", () => {
  it("answers a replacement price question mid-leak and prices the replacement (§20)", async () => {
    const conversation = startConversation();
    await say(conversation, "My roof leaks.");
    let result = await say(conversation, "How much does a roof replacement cost?");
    expect(result.response.reply).toBe(
      "It depends mostly on size, material and the roof's condition. Want me to work out a rough range?",
    );
    result = await say(conversation, "Yes, please");
    expect(result.response.next_goal).toBe("determine_roof_size");
    await say(conversation, "About 2,000 sq ft");
    await say(conversation, "Asphalt shingles");
    result = await say(conversation, "One story");
    expect(result.response.show_estimate).toBe(true);
    expect(result.estimate?.assumptions.join(" ")).toMatch(/2,000 sq ft/);
    expect(result.estimate?.low).toBeGreaterThan(5000);
  });

  it("never states a company policy it doesn't have (§28)", async () => {
    const conversation = startConversation();
    await say(conversation, "My roof leaks in the kitchen");
    const result = await say(conversation, "Do you work with insurance?");
    expect(result.response.reply).toMatch(/team (?:can )?confirm/i);
    expect(result.context.team_questions).toContain("insurance");
    expect(result.response.handoff).toBe(false);
    expect(result.response.next_goal).toBe("determine_active_leak");
  });

  it("is honest about being automated", async () => {
    const result = await say(startConversation(), "Am I talking to a real person?");
    expect(result.response.reply).toMatch(/automated advisor/);
  });

  it("offers the photo once and moves on when they can't (§23)", async () => {
    const conversation = startConversation();
    await say(conversation, "Water is coming through the bedroom ceiling whenever it rains.");
    await say(conversation, "Two weeks ago");
    await say(conversation, "No");
    let result = await say(conversation, "Yes, a shingle is missing");
    expect(result.response.request_photo).toBe(true);
    result = await say(conversation, "I don't have one right now");
    expect(result.assessment.photos_available).toBe(false);
    expect(result.response.request_photo).toBe(false);
    const remaining = [result.response.next_goal];
    for (const message of ["Not sure", "Jo", "555-555-0199"]) {
      remaining.push((await say(conversation, message)).response.next_goal);
    }
    expect(remaining).not.toContain("request_photo");
  });

  it("collects contact details only once the assessment is useful (§24)", async () => {
    const conversation = startConversation();
    const goals: string[] = [];
    for (const message of ["There's water coming through my ceiling.", "Bedroom.", "Only when it rains."]) {
      goals.push((await say(conversation, message)).response.next_goal ?? "");
    }
    expect(goals).not.toContain("determine_contact");
  });
});

describe("handoff and callback", () => {
  it("turns a callback request into a short contact flow (§25)", async () => {
    const conversation = startConversation();
    await say(conversation, "My roof is leaking.");
    await say(conversation, "Can I just speak to someone?");
    let result = await say(conversation, "Can someone call me back?");
    expect(result.response.next_goal).toBe("determine_contact");
    result = await say(conversation, "Dana");
    expect(result.assessment.name).toBe("Dana");
    expect(result.response.next_goal).toBe("determine_phone");
    result = await say(conversation, "(555) 555-0199");
    expect(result.response.next_goal).toBe("wrap_up");
    expect(result.context.stage).toBe("complete");
    expect(result.lead).toMatchObject({ name: "Dana", phone: "(555) 555-0199", preferred_contact_method: "phone" });
    expect(result.lead?.description).toMatch(/callback/);
  });

  it("goes back to the conversation when they'd rather keep chatting", async () => {
    const conversation = startConversation();
    await say(conversation, "My roof is leaking.");
    await say(conversation, "Can I just speak to someone?");
    const result = await say(conversation, "Let's keep chatting here.");
    expect(result.response.handoff).toBe(false);
    expect(result.context.stage).toBe("qualifying");
  });
});
