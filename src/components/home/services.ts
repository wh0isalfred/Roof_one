import type { IssueType } from "@/lib/leads/options";

export interface Service {
  id: string;
  title: string;
  summary: string;
  /** One-line card copy. */
  blurb: string;
  helpsWith: readonly string[];
  /** Preselected in the Roofing Advisor when the visitor continues from this service. */
  issue: IssueType;
  /** Framing for the shared roof photo; see RoofPhoto. */
  crop: string;
}

export const SERVICES: readonly Service[] = [
  {
    id: "storm-damage",
    title: "Storm Damage",
    blurb: "Fast response for severe weather.",
    summary:
      "After the storm, get the facts. We’ll assess the damage and guide your next steps.",
    helpsWith: [
      "Wind, hail and fallen-debris damage",
      "Temporary protection while repairs are planned",
      "Documenting what we find for your records",
      "Repair or replacement, depending on the damage",
    ],
    issue: "storm_damage",
    crop: "object-[85%_15%] scale-[1.7] origin-[85%_15%]",
  },
  {
    id: "roof-repair",
    title: "Roof Repair",
    blurb: "Fixing issues early saves money.",
    summary:
      "Fixing issues early can save you time, money and bigger problems later.",
    helpsWith: [
      "Leaks and water stains",
      "Missing, cracked or lifted shingles",
      "Flashing around chimneys, vents and skylights",
      "Small problems before they spread",
    ],
    issue: "repair",
    crop: "object-[44%_58%] scale-[2.6] origin-[44%_58%]",
  },
  {
    id: "roof-replacement",
    title: "Roof Replacement",
    blurb: "Long-term protection and higher value.",
    summary:
      "A new roof means better protection, more value and long-term peace of mind.",
    helpsWith: [
      "Roofs near the end of their life",
      "Choosing materials that suit your home",
      "Tear-off, installation and clean-up",
      "A clear plan before any work starts",
    ],
    issue: "replacement",
    crop: "object-[55%_35%]",
  },
  {
    id: "inspections",
    title: "Inspections",
    blurb: "Know your roof’s true condition.",
    summary:
      "A clear picture of your roof’s condition, so you can plan repairs before they become emergencies.",
    helpsWith: [
      "Roof condition checks",
      "Pre-purchase and pre-sale inspections",
      "Post-storm checkups",
      "Photos and notes on what we find",
    ],
    issue: "inspection",
    crop: "object-[30%_55%] scale-[1.9] origin-[30%_55%]",
  },
];
