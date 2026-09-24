import { describe, expect, it } from "vitest";
import { analyzeMessage, extractLocation, normalizePhone } from "../extraction";
import { detectIntent, detectSignals, normalize } from "../intents";
import { createAssessment, createContext } from "../state";
import type { AdvisorContext, AdvisorGoal, RoofingAssessment } from "../types";
import { FIXED_NOW } from "./harness";

function read(message: string, lastGoal: AdvisorGoal | null = null, assessment: RoofingAssessment = createAssessment()) {
  const context: AdvisorContext = { ...createContext(), last_goal: lastGoal };
  const analysis = analyzeMessage({ message, attachments: [], assessment, context, now: FIXED_NOW });
  return Object.fromEntries(analysis.updates.map((update) => [update.field, update.value]));
}

describe("intent", () => {
  it.each([
    ["My roof leaks.", "leak"],
    ["A storm blew some shingles off.", "storm_damage"],
    ["I need a few shingles replaced.", "repair"],
    ["I think I need a new roof.", "replacement"],
    ["Can someone inspect my roof?", "inspection"],
    ["How much does a new roof cost?", "pricing"],
    ["Something looks wrong with my roof.", "unknown"],
  ])("%j is %s", (message, intent) => {
    expect(detectIntent(normalize(message))?.value).toBe(intent);
  });

  it("isn't fooled by negation", () => {
    expect(detectIntent(normalize("No leaks, it's just old."))?.value).not.toBe("leak");
    expect(read("It's not leaking right now", "determine_active_leak").active_leak).toBe(false);
  });

  it("treats a hedged leak as less certain", () => {
    expect(detectIntent(normalize("I think I have a leak."))?.confidence).toBeLessThan(0.8);
  });
});

describe("signals", () => {
  it("knows a stop request from a leak that won't stop", () => {
    expect(detectSignals(normalize("Stop.")).stop).toBe(true);
    expect(detectSignals(normalize("I don't want to do this.")).stop).toBe(true);
    expect(detectSignals(normalize("It won't stop leaking")).stop).toBe(false);
    expect(detectSignals(normalize("Never mind the gutters, it's the roof")).stop).toBe(false);
  });

  it("separates a callback request from giving a name", () => {
    expect(detectSignals(normalize("Can someone call me back?")).callbackRequest).toBe(true);
    expect(read("Can someone call me back?").name).toBeUndefined();
  });

  it("spots company questions only when they're questions", () => {
    expect(detectSignals(normalize("Do you offer financing?")).policyTopic).toBe("financing");
    expect(detectSignals(normalize("We already filed an insurance claim.")).policyTopic).toBeNull();
  });

  it("flags water near electrical fixtures", () => {
    expect(detectSignals(normalize("Water is dripping around the ceiling light")).electricalHazard).toBe(true);
  });
});

describe("roof age", () => {
  it.each([
    ["The roof is about 12 years old.", 12],
    ["It's a 20-year-old roof", 20],
    ["We had it installed in 2016", 10],
    ["The roof was put on about fifteen years ago", 15],
    ["The roof is probably 15", 15],
  ])("%j → %d", (message, age) => {
    expect(read(message).roof_age).toBe(age);
  });

  it("reads short answers to the age question", () => {
    expect(read("Maybe 12 years.", "determine_roof_age").roof_age).toBe(12);
    expect(read("10–20 years", "determine_roof_age").roof_age).toBe(15);
    expect(read("Over 20 years", "determine_roof_age").roof_age).toBe(22);
  });

  it("doesn't read a time as an age", () => {
    const facts = read("It started leaking 3 weeks ago");
    expect(facts.roof_age).toBeUndefined();
    expect(facts.issue_started).toBe("3 weeks ago");
  });
});

describe("time", () => {
  it("attributes dates to the storm or the problem", () => {
    const facts = read("We had a storm two weeks ago and the ceiling started leaking yesterday.");
    expect(facts.storm_date).toBe("two weeks ago");
    expect(facts.issue_started).toBe("yesterday");
  });

  it("turns durations into when it started", () => {
    expect(read("It's been leaking for a month.").issue_started).toBe("about a month ago");
  });
});

describe("where the water is", () => {
  it.each([
    ["water coming through my bedroom ceiling", "bedroom ceiling"],
    ["it's dripping in the upstairs bathroom", "upstairs bathroom"],
    ["there's a leak around the chimney", "around the chimney"],
    ["a stain on the ceiling", "ceiling"],
  ])("%j → %j", (message, location) => {
    expect(extractLocation(normalize(message))).toBe(location);
  });

  it("ignores rooms that describe the house", () => {
    expect(read("We have a 3 bedroom house and the roof leaks").leak_location).toBeUndefined();
  });
});

describe("damage", () => {
  it("reads missing shingles and how much", () => {
    const facts = read("Half the shingles on the back look gone.");
    expect(facts.missing_shingles).toBe(true);
    expect(facts.visible_damage).toEqual(["large area of missing shingles"]);
  });

  it("reads an open roof as exposed", () => {
    expect(read("There's a hole in the roof").exposed_roof).toBe(true);
  });
});

describe("contact details", () => {
  it("normalizes US phone numbers", () => {
    expect(normalizePhone("555.555.0134")).toBe("(555) 555-0134");
    expect(normalizePhone("+1 (555) 555-0134")).toBe("(555) 555-0134");
    expect(normalizePhone("555-0134")).toBeNull();
  });

  it("reads a name, phone and email in one reply", () => {
    const facts = read("sarah jones, 555-555-0134, sarah@example.com", "determine_contact");
    expect(facts).toMatchObject({ name: "Sarah Jones", phone: "(555) 555-0134", email: "sarah@example.com" });
  });

  it("doesn't mistake a room for a name", () => {
    expect(read("Upstairs bathroom", "determine_contact").name).toBeUndefined();
  });

  it("reads an address", () => {
    expect(read("418 Maple Ave, Springfield, IL 62704", "determine_address")).toMatchObject({
      address: "418 Maple Ave",
      city: "Springfield",
      state: "IL",
      zip_code: "62704",
    });
  });

  it("flags a phone number with missing digits", () => {
    const assessment = { ...createAssessment(), name: "Sam" };
    const context: AdvisorContext = { ...createContext(), last_goal: "determine_phone" };
    const analysis = analyzeMessage({ message: "555-0134 22", attachments: [], assessment, context, now: FIXED_NOW });
    expect(analysis.invalidPhone).toBe(true);
  });
});
