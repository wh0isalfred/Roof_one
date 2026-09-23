import type { IssueType } from "@/lib/leads/options";

/*
 * Homepage copy that isn't tied to a single component. Everything here is
 * placeholder content: review it with the company before launch, and don't
 * add claims (ratings, certifications, warranties, years in business, service
 * areas) until they're confirmed.
 */

export interface ProcessStep {
  title: string;
  description: string;
}

export const PROCESS_STEPS: readonly ProcessStep[] = [
  {
    title: "Tell us what’s going on",
    description:
      "Answer a few questions about the problem and your roof. Add photos if you have them.",
  },
  {
    title: "We review your request",
    description:
      "Our team looks over your answers and photos before reaching out.",
  },
  {
    title: "We set up a visit",
    description:
      "We contact you the way you prefer and find a time to look at the roof.",
  },
  {
    title: "You get a clear plan",
    description:
      "You’ll know what’s wrong, what it takes to fix it, and what happens next.",
  },
];

export interface Service {
  issue: Exclude<IssueType, "not_sure">;
  title: string;
  description: string;
}

export const SERVICES: readonly Service[] = [
  {
    issue: "leak",
    title: "Leak & water damage repair",
    description:
      "Find where the water is getting in and stop it before it spreads.",
  },
  {
    issue: "storm_damage",
    title: "Storm damage repair",
    description: "Repairs after wind, hail, or falling branches.",
  },
  {
    issue: "repair",
    title: "Roof repair",
    description:
      "Missing shingles, damaged flashing, worn seals, and other fixes.",
  },
  {
    issue: "replacement",
    title: "Roof replacement",
    description:
      "A full replacement when repairs no longer make sense for the roof.",
  },
  {
    issue: "inspection",
    title: "Roof inspection",
    description:
      "A close look at the roof’s condition, so you know where things stand.",
  },
];

export interface Project {
  title: string;
  category: string;
  summary: string;
}

// Placeholder entries. Replace with real projects and before/after photos.
export const PROJECTS: readonly Project[] = [
  {
    title: "Full roof replacement",
    category: "Replacement",
    summary:
      "Project summary goes here: the starting condition, the work, and the result.",
  },
  {
    title: "Leak repair around a chimney",
    category: "Repair",
    summary:
      "Project summary goes here: the starting condition, the work, and the result.",
  },
  {
    title: "Storm damage repair",
    category: "Storm damage",
    summary:
      "Project summary goes here: the starting condition, the work, and the result.",
  },
];

export interface Review {
  id: string;
  quote: string;
  author: string;
  context: string;
}

// Placeholder entries. Only publish real reviews, with the customer’s permission.
export const REVIEWS: readonly Review[] = [
  {
    id: "review-1",
    quote: "A customer review will go here once it’s collected and approved.",
    author: "Customer name",
    context: "Roof replacement",
  },
  {
    id: "review-2",
    quote: "A customer review will go here once it’s collected and approved.",
    author: "Customer name",
    context: "Leak repair",
  },
  {
    id: "review-3",
    quote: "A customer review will go here once it’s collected and approved.",
    author: "Customer name",
    context: "Storm damage repair",
  },
];

export interface Faq {
  question: string;
  answer: string;
}

export const FAQS: readonly Faq[] = [
  {
    question: "What happens after I finish the assessment?",
    answer:
      "Your answers and photos go to our team. Someone will contact you the way you prefer to talk through the problem and, if needed, set up a time to look at the roof.",
  },
  {
    question: "Do I need to know my roof’s age or type?",
    answer:
      "No. Choose “Not sure” for anything you don’t know. We’ll figure it out together.",
  },
  {
    question: "My roof is leaking right now. What should I do?",
    answer:
      "Move belongings away from the water, catch drips with a bucket, and stay off the roof. Then call us so we can talk through next steps.",
  },
  {
    question: "Are photos required?",
    answer:
      "No, but they help. You can add photos from your phone during the assessment so the team can see what you’re seeing.",
  },
  {
    question: "How do I know if I need a repair or a replacement?",
    answer:
      "It depends on the roof’s age, how widespread the damage is, and its overall condition. An inspection is the most reliable way to know, and we’ll explain what we find.",
  },
];
