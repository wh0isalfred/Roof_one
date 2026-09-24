import { describe, expect, it } from "vitest";
import { estimate, estimateFromAssessment, parseSquareFeet } from "../pricing";
import { createAssessment } from "../state";

describe("preliminary estimates", () => {
  it("prices a typical replacement from defaults, with its assumptions", () => {
    const result = estimate({ intent: "replacement" });
    expect(result).toMatchObject({ low: 8500, high: 14500, currency: "USD", confidence: "low" });
    expect(result?.assumptions).toContain("Assumes a typical 2,000 sq ft roof");
  });

  it("scales with roof size and material, and gets more confident", () => {
    const shingles = estimate({ intent: "replacement", roof_size: 3000, roof_material: "asphalt shingles" });
    const metal = estimate({ intent: "replacement", roof_size: 3000, roof_material: "metal" });
    expect(shingles?.confidence).toBe("high");
    expect(metal?.low).toBeGreaterThan(shingles?.low ?? 0);
  });

  it("works out roof area from the home size and stories", () => {
    const oneStory = estimate({ intent: "replacement", home_size: 2000, stories: 1 });
    const twoStory = estimate({ intent: "replacement", home_size: 2000, stories: 2 });
    expect(twoStory?.high).toBeLessThan(oneStory?.high ?? 0);
  });

  it("prices repairs by damage level", () => {
    const minor = estimate({ intent: "leak", damage_level: "minor" });
    const major = estimate({ intent: "leak", damage_level: "major" });
    expect(minor?.high).toBeLessThan(major?.low ?? 0);
    expect(major?.confidence).toBe("low");
  });

  it("never guesses a price for an inspection or an unknown problem", () => {
    expect(estimate({ intent: "inspection" })).toBeNull();
    expect(estimateFromAssessment({ ...createAssessment(), intent: "unknown" })).toBeNull();
  });

  it("returns whole-number ranges with low below high", () => {
    for (const intent of ["leak", "repair", "storm_damage", "replacement"]) {
      const result = estimate({ intent, roof_age: 23, stories: 2, roof_material: "tile" });
      expect(result).not.toBeNull();
      expect(Number.isInteger(result?.low)).toBe(true);
      expect(result?.low).toBeLessThan(result?.high ?? 0);
    }
  });

  it("prices a replacement when that's what they asked about", () => {
    const leak = { ...createAssessment(), intent: "leak" as const, home_size: "2,000 sq ft" };
    expect(estimateFromAssessment(leak)?.high).toBeLessThan(5000);
    expect(estimateFromAssessment(leak, "replacement")?.low).toBeGreaterThan(5000);
  });
});

describe("square feet", () => {
  it.each([
    ["about 2,000 sq ft", 2000],
    ["1,500–2,500 sq ft", 2000],
    ["under 1,500 sq ft", 1200],
    ["over 2,500 sq ft", 3000],
    ["1.8k sq ft", 1800],
    ["3-bedroom home", 1600],
  ])("%j → %d", (value, expected) => {
    expect(parseSquareFeet(value)).toBe(expected);
  });
});
