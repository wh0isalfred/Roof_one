import type { EstimateFocus, EstimateInput, EstimateResult, RoofingAssessment } from "./types";

/*
 * Deterministic preliminary estimates.
 *
 * The AI never produces a price. It decides when an estimate is worth
 * showing; the numbers come only from here.
 *
 * PRELIMINARY PLANNING RANGES, NOT ROOF ONE PRICING. Replace
 * PRELIMINARY_PRICING with the company's real pricing rules before launch.
 * Every estimate is shown as a rough range with its assumptions, never as a
 * quote.
 */

type Range = readonly [low: number, high: number];
type MaterialKey = "asphalt" | "metal" | "tile" | "slate" | "flat" | "wood";
type DamageLevel = "minor" | "moderate" | "major";
type RepairIntent = "leak" | "repair" | "storm_damage";

export const PRELIMINARY_PRICING = {
  currency: "USD",
  /** Installed cost per square foot of roof surface for a full replacement. */
  replacementPerSqFt: {
    asphalt: [4.25, 7.25],
    metal: [9.5, 16],
    tile: [11, 20],
    slate: [15, 30],
    flat: [6, 11],
    wood: [7.5, 14],
  } satisfies Record<MaterialKey, Range>,
  /** Roof surface assumed when the size isn't known. */
  defaultRoofSqFt: 2000,
  /** Roof surface per square foot of footprint, allowing for pitch and overhangs. */
  roofToFootprint: 1.15,
  /** Typical living area by bedroom count, when that's all we know. */
  homeSqFtByBedrooms: { 2: 1100, 3: 1600, 4: 2300, 5: 3000 } as Record<number, number>,
  replacementStoryFactor: [1, 1, 1.08, 1.15],
  repair: {
    leak: { minor: [350, 1200], moderate: [650, 2800], major: [2500, 7500] },
    repair: { minor: [300, 1000], moderate: [650, 2400], major: [2000, 6500] },
    storm_damage: { minor: [600, 2000], moderate: [1800, 6200], major: [5000, 15000] },
  } satisfies Record<RepairIntent, Record<DamageLevel, Range>>,
  repairMaterialFactor: {
    asphalt: 1,
    metal: 1.25,
    tile: 1.35,
    slate: 1.5,
    flat: 1.1,
    wood: 1.2,
  } satisfies Record<MaterialKey, number>,
  /** Older roofs are brittle, so repairs reach further. */
  repairAgeFactor: [
    { under: 10, factor: 1 },
    { under: 20, factor: 1.1 },
    { under: Number.POSITIVE_INFINITY, factor: 1.2 },
  ],
  repairStoryFactor: [1, 1, 1.05, 1.1],
} as const;

const MATERIAL_LABELS: Record<MaterialKey, string> = {
  asphalt: "asphalt shingles",
  metal: "metal",
  tile: "tile",
  slate: "slate",
  flat: "a flat or low-slope roof",
  wood: "wood shakes",
};

export function materialKey(material: string | undefined | null): MaterialKey | null {
  if (!material) return null;
  const value = material.toLowerCase();
  if (/metal|steel|tin|alum|standing/.test(value)) return "metal";
  if (/slate/.test(value)) return "slate";
  if (/tile|clay|terra|concrete/.test(value)) return "tile";
  if (/flat|low.?slope|tpo|epdm|rubber|membrane|bitumen|built|tar/.test(value)) return "flat";
  if (/wood|cedar|shake/.test(value)) return "wood";
  if (/asphalt|shingle|architectural|tab|composition/.test(value)) return "asphalt";
  return null;
}

/** "about 2,000 sq ft", "1,500–2,500 sq ft", "under 1,500 sq ft" → square feet. */
export function parseSquareFeet(value: string | null | undefined): number | null {
  if (!value) return null;
  const text = value.toLowerCase();
  const numbers = [...text.matchAll(/(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(\s*k)?/g)]
    .map((match) => {
      const base = Number((match[1] ?? "").replace(/,/g, ""));
      return match[2] ? base * 1000 : base;
    })
    .filter((n) => Number.isFinite(n) && n >= 100);
  if (numbers.length === 0) {
    const bedrooms = /(\d)-bedroom/.exec(text);
    const typical = bedrooms ? PRELIMINARY_PRICING.homeSqFtByBedrooms[Number(bedrooms[1])] : undefined;
    return typical ?? null;
  }
  const first = numbers[0] ?? 0;
  const second = numbers[1];
  if (second !== undefined && second > first) return Math.round((first + second) / 2);
  if (/\b(?:under|less than|below)\b/.test(text)) return Math.round(first * 0.8);
  if (/\b(?:over|more than|above)\b|\+/.test(text)) return Math.round(first * 1.2);
  return first;
}

function roundPrice(value: number): number {
  const step = value < 5000 ? 50 : 100;
  return Math.round(value / step) * step;
}

function storyFactor(table: readonly number[], stories: number | undefined): number {
  if (!stories || stories < 1) return 1;
  return table[Math.min(stories, table.length - 1)] ?? 1;
}

function isRepairIntent(intent: string): intent is RepairIntent {
  return intent === "leak" || intent === "repair" || intent === "storm_damage";
}

function isDamageLevel(level: string | undefined): level is DamageLevel {
  return level === "minor" || level === "moderate" || level === "major";
}

const numberFormat = new Intl.NumberFormat("en-US");

/**
 * A preliminary range from the pricing rules above, or null when a price
 * shouldn't be guessed (inspections, or an unidentified problem).
 */
export function estimate(input: EstimateInput): EstimateResult | null {
  const pricing = PRELIMINARY_PRICING;
  const material = materialKey(input.roof_material);

  if (input.intent === "replacement") {
    const assumptions: string[] = [];
    let area: number;
    if (input.roof_size) {
      area = input.roof_size;
      assumptions.push(`About ${numberFormat.format(area)} sq ft of roof`);
    } else if (input.home_size) {
      const floors = input.stories ?? 1.5;
      area = Math.round((input.home_size / floors) * pricing.roofToFootprint);
      assumptions.push(
        input.stories
          ? `Roof area worked out from a ${numberFormat.format(input.home_size)} sq ft, ${input.stories}-story home`
          : `Roof area worked out from a ${numberFormat.format(input.home_size)} sq ft home of one or two stories`,
      );
    } else {
      area = pricing.defaultRoofSqFt;
      assumptions.push(`Assumes a typical ${numberFormat.format(area)} sq ft roof`);
    }
    const key = material ?? "asphalt";
    assumptions.push(material ? `New ${MATERIAL_LABELS[key]}` : "Assumes asphalt shingles");
    assumptions.push("Removing one layer of old roofing");
    assumptions.push("Excludes decking or structural repairs");

    const [lowRate, highRate] = pricing.replacementPerSqFt[key];
    const factor = storyFactor(pricing.replacementStoryFactor, input.stories);
    const sized = Boolean(input.roof_size || input.home_size);
    return {
      low: roundPrice(area * lowRate * factor),
      high: roundPrice(area * highRate * factor),
      currency: pricing.currency,
      confidence: input.roof_size && material ? "high" : sized && (material || input.stories) ? "medium" : "low",
      assumptions,
    };
  }

  if (isRepairIntent(input.intent)) {
    const level = isDamageLevel(input.damage_level) ? input.damage_level : "moderate";
    const [baseLow, baseHigh] = pricing.repair[input.intent][level];
    const materialFactor = material ? pricing.repairMaterialFactor[material] : 1;
    const ageFactor =
      input.roof_age === undefined
        ? 1
        : (pricing.repairAgeFactor.find((band) => (input.roof_age ?? 0) < band.under)?.factor ?? 1);
    const factor = materialFactor * ageFactor * storyFactor(pricing.repairStoryFactor, input.stories);

    const work = input.intent === "leak" ? "leak repair" : input.intent === "storm_damage" ? "storm repair" : "roof repair";
    const assumptions = [
      `A typical ${level === "moderate" ? "" : `${level} `}${work}${input.repair_scope ? ` (${input.repair_scope})` : ""}`,
      material ? `On ${MATERIAL_LABELS[material]}` : "Assumes asphalt shingles",
    ];
    if (input.roof_age !== undefined && input.roof_age >= 10) {
      assumptions.push(`Allows for a ${input.roof_age}-year-old roof`);
    }
    assumptions.push("The cause still needs to be confirmed on site");
    assumptions.push("Excludes interior repairs like drywall and paint");
    if (input.intent === "storm_damage" && level === "major") {
      assumptions.push("Heavy storm damage can mean a partial or full replacement instead");
    }
    return {
      low: roundPrice(baseLow * factor),
      high: roundPrice(baseHigh * factor),
      currency: pricing.currency,
      confidence: input.damage_level && input.repair_scope ? "medium" : "low",
      assumptions,
    };
  }

  return null;
}

function damageLevel(a: RoofingAssessment): DamageLevel {
  const items = a.visible_damage ?? [];
  if (a.exposed_roof === true || items.some((item) => /large area|tree|sagging|exposed|opening/.test(item))) {
    return "major";
  }
  const shingleDamage = a.missing_shingles === true || a.damaged_shingles === true || items.length > 0;
  if (shingleDamage && (a.interior_damage === true || a.active_leak === true)) return "moderate";
  if (items.length === 1 && /^(?:a missing shingle|dents|moss or algae|granule loss)$/.test(items[0] ?? "") && a.interior_damage !== true) {
    return "minor";
  }
  return "moderate";
}

function priceableIntent(a: RoofingAssessment, focus: EstimateFocus | null): string | null {
  if (focus === "replacement") return "replacement";
  if (focus === "repair" && (a.intent === "leak" || a.intent === "storm_damage" || a.intent === "repair")) return a.intent;
  if (focus === "repair") return "repair";
  switch (a.intent) {
    case "leak":
    case "repair":
    case "storm_damage":
    case "replacement":
      return a.intent;
    case "pricing":
      return a.repair_interest === true && a.replacement_interest !== true ? "repair" : "replacement";
    default:
      return null;
  }
}

/**
 * Maps what the advisor knows onto the estimate engine's input. `focus`
 * prices what the homeowner asked about when it differs from the
 * conversation, like a replacement quote during a leak conversation.
 */
export function estimateInputFromAssessment(
  a: RoofingAssessment,
  focus: EstimateFocus | null = null,
): EstimateInput | null {
  const intent = priceableIntent(a, focus);
  if (!intent) return null;
  const roofSize = parseSquareFeet(a.roof_size);
  const homeSize = parseSquareFeet(a.home_size);
  const scope = a.visible_damage?.filter((item) => item !== "visible damage reported").slice(0, 2).join(", ");
  return {
    intent,
    ...(roofSize ? { roof_size: roofSize } : {}),
    ...(homeSize ? { home_size: homeSize } : {}),
    ...(a.roof_material ? { roof_material: a.roof_material } : {}),
    ...(a.roof_age !== null ? { roof_age: a.roof_age } : {}),
    ...(a.stories !== null ? { stories: a.stories } : {}),
    ...(intent !== "replacement" ? { damage_level: damageLevel(a) } : {}),
    ...(scope ? { repair_scope: scope } : {}),
  };
}

export function estimateFromAssessment(
  a: RoofingAssessment,
  focus: EstimateFocus | null = null,
): EstimateResult | null {
  const input = estimateInputFromAssessment(a, focus);
  return input ? estimate(input) : null;
}

export function formatMoney(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
