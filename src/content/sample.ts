/*
 * SAMPLE CONTENT — REPLACE BEFORE LAUNCH.
 *
 * Placeholder claims kept at the owner's request. None of it is confirmed:
 * the customer count, service area, testimonials, ratings, headshots
 * (AI-generated), FAQ answers, social links and legal links. This file is a
 * deliberate, temporary exception to the "no unconfirmed claims" rule in
 * AGENTS.md; swap in real details (or remove the claims) before going live.
 */
import {
  avatar3,
  avatar4,
  avatarMike,
  avatarSarah,
} from "@/assets/photos";

export const SAMPLE_PROOF = {
  headline: "18,000+ homeowners",
  detail: "across New York",
  photos: [avatarSarah, avatarMike, avatar3, avatar4],
} as const;

export const SAMPLE_REVIEWS = [
  {
    quote:
      "I sent photos of a ceiling stain on a Sunday night and had a call back Monday morning. They fixed the flashing and didn’t try to sell me a new roof.",
    name: "Sarah M.",
    detail: "Leak repair",
    photo: avatarSarah,
    rating: 5,
  },
  {
    quote:
      "They showed me photos of every problem before giving a price. The crew finished in a day and left the driveway cleaner than they found it.",
    name: "Mike T.",
    detail: "Roof replacement",
    photo: avatarMike,
    rating: 5,
  },
] as const;

export const SAMPLE_FAQS = [
  {
    question: "How long does a roof replacement take?",
    answer:
      "Most houses take one to three days. Size, pitch, the material you choose and the weather all play a part. You’ll get a start date and a rough timeline with your estimate.",
  },
  {
    question: "Do you work with insurance claims?",
    answer:
      "Yes. After a storm we photograph and write up the damage so you have what your insurer asks for, and we can talk it through with your adjuster.",
  },
  {
    question: "What roofing materials do you install?",
    answer:
      "Asphalt shingles, metal, tile and flat-roof systems. We’ll tell you what suits the house, the budget and how long you plan to stay.",
  },
  {
    question: "Is there a warranty on your work?",
    answer:
      "Our workmanship is covered, and most materials come with a manufacturer warranty. We’ll give you the details in writing with your estimate.",
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
