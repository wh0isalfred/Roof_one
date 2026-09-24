import type { StaticImageData } from "next/image";
import { heroPhoto, roofAfter, roofBefore, roofTexture } from "@/assets/photos";
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
  photo: StaticImageData;
  /** Tailwind framing for the photo in the wide detail header; see RoofPhoto. */
  crop: string;
  /** Tailwind framing for the photo in the tall homepage tile. */
  tileCrop: string;
}

export const SERVICES: readonly Service[] = [
  {
    id: "storm-damage",
    title: "Storm Damage",
    blurb: "Wind, hail and fallen branches.",
    summary:
      "From the ground it’s hard to tell what’s cosmetic and what will leak. We get up there, photograph what we find and tell you what needs fixing now.",
    helpsWith: [
      "Wind, hail and fallen-debris damage",
      "Temporary protection while repairs are planned",
      "Documenting what we find for your records",
      "Repair or replacement, depending on the damage",
    ],
    issue: "storm_damage",
    photo: roofBefore,
    crop: "object-[45%_30%]",
    tileCrop: "object-[12%_62%] scale-[1.35] origin-[20%_62%]",
  },
  {
    id: "roof-repair",
    title: "Roof Repair",
    blurb: "Leaks, missing shingles, loose flashing.",
    summary:
      "Most roofs don’t need replacing. They need one problem found and fixed. We trace where the water gets in and fix that.",
    helpsWith: [
      "Leaks and water stains",
      "Missing, cracked or lifted shingles",
      "Flashing around chimneys, vents and skylights",
      "Small problems before they spread",
    ],
    issue: "repair",
    photo: heroPhoto,
    crop: "object-[44%_58%] scale-[2.2] origin-[44%_58%]",
    tileCrop: "object-[28%_70%] scale-[1.3] origin-[28%_62%]",
  },
  {
    id: "roof-replacement",
    title: "Roof Replacement",
    blurb: "For when patching stops making sense.",
    summary:
      "Near the end of a roof’s life, repairs come more often and buy less time. We’ll tell you straight whether yours is there yet.",
    helpsWith: [
      "Roofs near the end of their life",
      "Choosing materials that suit your home",
      "Tear-off, installation and clean-up",
      "A clear plan before any work starts",
    ],
    issue: "replacement",
    photo: roofAfter,
    crop: "object-[50%_35%]",
    tileCrop: "object-[64%_40%]",
  },
  {
    id: "inspections",
    title: "Inspections",
    blurb: "Buying, selling, or just checking.",
    summary:
      "A full look at the roof, attic and gutters, with photos and a written summary of what’s fine, what to watch and what to fix.",
    helpsWith: [
      "Roof condition checks",
      "Pre-purchase and pre-sale inspections",
      "Post-storm checkups",
      "Photos and notes on what we find",
    ],
    issue: "inspection",
    photo: roofTexture,
    crop: "object-center",
    tileCrop: "object-[40%_50%]",
  },
];
