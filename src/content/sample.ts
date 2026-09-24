/*
 * SAMPLE CONTENT — REPLACE BEFORE LAUNCH.
 *
 * Copied from the design reference at the owner's request. None of it is
 * confirmed: the customer count, service area, testimonials, ratings,
 * warranty answer and social links are placeholders. This file is a
 * deliberate, temporary exception to the "no unconfirmed claims" rule in
 * AGENTS.md; swap in real details (or remove the claims) before going live.
 */

export const SAMPLE_PROOF = {
  headline: "18k+ Satisfied Customers",
  detail: "All Over New York",
  initials: ["JR", "AL", "DK"],
} as const;

export const SAMPLE_REVIEWS_INTRO =
  "Thousands of families have chosen Roof One for reliable service, quality work and peace of mind.";

export const SAMPLE_REVIEWS = [
  {
    quote:
      "The AI assessment was super easy and the team got back to me within hours. My roof looks amazing!",
    name: "Sarah M.",
    initials: "SM",
    rating: 5,
  },
  {
    quote:
      "Professional, fast and reliable. They handled everything from inspection to repairs.",
    name: "Mike T.",
    initials: "MT",
    rating: 5,
  },
] as const;

export const SAMPLE_FAQS = [
  {
    question: "How long does a roof replacement take?",
    answer:
      "Most residential replacements take one to three days, depending on the size of the roof, the materials and the weather. We’ll give you a schedule before work starts.",
  },
  {
    question: "Do you work with insurance claims?",
    answer:
      "Yes. After storm damage we document what we find and can walk you through what your insurer will need.",
  },
  {
    question: "What types of roofing materials do you offer?",
    answer:
      "Asphalt shingles, metal, tile and flat-roof systems. We’ll recommend what suits your home, budget and climate.",
  },
  {
    question: "Is there a warranty on your work?",
    answer:
      "Yes. Our workmanship is covered, and most materials carry a manufacturer warranty. We’ll go through the details with your estimate.",
  },
] as const;

export const SAMPLE_SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/", icon: "facebook" },
  { label: "Instagram", href: "https://www.instagram.com/", icon: "instagram" },
  { label: "LinkedIn", href: "https://www.linkedin.com/", icon: "linkedin" },
] as const;

export const SAMPLE_LEGAL_LINKS = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
] as const;
