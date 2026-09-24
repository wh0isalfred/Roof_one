import type { IssueType } from "@/lib/leads/options";

export interface Service {
  id: string;
  title: string;
  summary: string;
  helpsWith: readonly string[];
  /** Preselected in the Roofing Advisor when the visitor continues from this service. */
  issue: IssueType;
  /** Framing for the shared roof photo; see RoofPhoto. */
  crop: string;
}

export const SERVICES: readonly [Service, Service, Service] = [
  {
    id: "storm-damage",
    title: "Storm Damage",
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
];
