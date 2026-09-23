import {
  CONTACT_METHOD_OPTIONS,
  ISSUE_TYPE_OPTIONS,
  ROOF_AGE_OPTIONS,
  ROOF_TYPE_OPTIONS,
  TIME_WINDOW_OPTIONS,
  URGENCY_OPTIONS,
} from "@/lib/leads/options";
import type { AdvisorStep } from "./types";

/**
 * The scripted assessment flow. It works on its own with no AI provider; any
 * future AI assistance layers on top of these steps rather than replacing them.
 */
export const ADVISOR_STEPS: readonly [AdvisorStep, ...AdvisorStep[]] = [
  {
    id: "issue",
    kind: "choice",
    field: "issue_type",
    label: "Issue",
    title: "What’s the main issue?",
    helper: "Pick the closest match.",
    options: ISSUE_TYPE_OPTIONS,
  },
  {
    id: "urgency",
    kind: "choice",
    field: "urgency",
    label: "Urgency",
    title: "How urgent is it?",
    helper: "This helps the team know how quickly to respond.",
    options: URGENCY_OPTIONS,
  },
  {
    id: "roof_age",
    kind: "choice",
    field: "roof_age",
    label: "Roof age",
    title: "About how old is the roof?",
    helper: "A rough guess is fine.",
    options: ROOF_AGE_OPTIONS,
  },
  {
    id: "roof_type",
    kind: "choice",
    field: "roof_type",
    label: "Roof type",
    title: "What kind of roof is it?",
    options: ROOF_TYPE_OPTIONS,
  },
  {
    id: "property",
    kind: "fields",
    label: "Property",
    title: "Where is the property?",
    fields: [
      {
        kind: "text",
        name: "address",
        label: "Street address",
        type: "text",
        required: true,
        autoComplete: "address-line1",
      },
      {
        kind: "text",
        name: "city",
        label: "City",
        type: "text",
        autoComplete: "address-level2",
      },
      {
        kind: "text",
        name: "state",
        label: "State",
        type: "text",
        autoComplete: "address-level1",
      },
      {
        kind: "text",
        name: "zip_code",
        label: "ZIP code",
        type: "text",
        required: true,
        autoComplete: "postal-code",
        inputMode: "numeric",
      },
    ],
  },
  {
    id: "description",
    kind: "fields",
    label: "Details",
    title: "What are you seeing?",
    helper: "Where the problem is, when it started, and anything you’ve tried.",
    fields: [
      {
        kind: "text",
        name: "description",
        label: "Describe the problem",
        type: "textarea",
      },
    ],
  },
  {
    id: "photos",
    kind: "photos",
    label: "Photos",
    title: "Do you have photos?",
    helper:
      "Photos of the damage or the roof help the team prepare. This step is optional.",
  },
  {
    id: "name",
    kind: "fields",
    label: "Name",
    title: "What’s your name?",
    fields: [
      {
        kind: "text",
        name: "name",
        label: "Full name",
        type: "text",
        required: true,
        autoComplete: "name",
      },
    ],
  },
  {
    id: "phone",
    kind: "fields",
    label: "Phone",
    title: "What’s the best number to reach you?",
    fields: [
      {
        kind: "text",
        name: "phone",
        label: "Phone number",
        type: "tel",
        required: true,
        autoComplete: "tel",
        inputMode: "tel",
      },
    ],
  },
  {
    id: "email",
    kind: "fields",
    label: "Email",
    title: "What’s your email?",
    helper: "Optional.",
    fields: [
      {
        kind: "text",
        name: "email",
        label: "Email address",
        type: "email",
        autoComplete: "email",
        inputMode: "email",
      },
    ],
  },
  {
    id: "appointment",
    kind: "fields",
    label: "Scheduling",
    title: "When should we come out?",
    helper: "Tell us what works for a visit and how you’d like to be contacted.",
    fields: [
      {
        kind: "text",
        name: "requested_date",
        label: "Preferred date",
        type: "date",
      },
      {
        kind: "select",
        name: "preferred_time",
        label: "Time of day",
        options: TIME_WINDOW_OPTIONS,
      },
      {
        kind: "select",
        name: "preferred_contact_method",
        label: "Best way to reach you",
        options: CONTACT_METHOD_OPTIONS,
      },
    ],
  },
  {
    id: "review",
    kind: "review",
    label: "Review",
    title: "Review your request",
    helper: "Check the details before sending them to the team.",
  },
];
