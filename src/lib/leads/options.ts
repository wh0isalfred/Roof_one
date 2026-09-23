import type { Option } from "@/lib/options";

/*
 * Allowed values for the lead model.
 *
 * Each list mirrors a Postgres enum in supabase/migrations — change both
 * together. Labels and descriptions are UI copy and can change freely.
 */

export const ISSUE_TYPE_OPTIONS = [
  {
    value: "leak",
    label: "Leak / Water Damage",
    description: "Drips, stains, or damp spots inside.",
  },
  {
    value: "storm_damage",
    label: "Storm Damage",
    description: "Wind, hail, or debris hit the roof.",
  },
  {
    value: "repair",
    label: "Roof Repair",
    description: "Missing shingles, flashing, or wear.",
  },
  {
    value: "replacement",
    label: "Roof Replacement",
    description: "The roof is near the end of its life.",
  },
  {
    value: "inspection",
    label: "Inspection",
    description: "You want to know the roof’s condition.",
  },
  {
    value: "not_sure",
    label: "Not Sure",
    description: "Something seems off. We’ll help figure it out.",
  },
] as const satisfies readonly Option[];

export type IssueType = (typeof ISSUE_TYPE_OPTIONS)[number]["value"];

export const URGENCY_OPTIONS = [
  {
    value: "emergency",
    label: "It’s urgent",
    description: "Water is coming in or the damage is getting worse.",
  },
  {
    value: "soon",
    label: "Soon",
    description: "It needs attention in the next few weeks.",
  },
  {
    value: "planning",
    label: "Planning ahead",
    description: "No rush. I’m gathering information.",
  },
] as const satisfies readonly Option[];

export type Urgency = (typeof URGENCY_OPTIONS)[number]["value"];

export const ROOF_AGE_OPTIONS = [
  { value: "under_5", label: "Less than 5 years" },
  { value: "5_to_10", label: "5–10 years" },
  { value: "10_to_20", label: "10–20 years" },
  { value: "over_20", label: "More than 20 years" },
  { value: "unknown", label: "Not sure" },
] as const satisfies readonly Option[];

export type RoofAge = (typeof ROOF_AGE_OPTIONS)[number]["value"];

export const ROOF_TYPE_OPTIONS = [
  { value: "asphalt_shingle", label: "Asphalt shingle" },
  { value: "metal", label: "Metal" },
  { value: "tile", label: "Tile" },
  { value: "flat", label: "Flat / low slope" },
  { value: "other", label: "Something else" },
  { value: "unknown", label: "Not sure" },
] as const satisfies readonly Option[];

export type RoofType = (typeof ROOF_TYPE_OPTIONS)[number]["value"];

export const CONTACT_METHOD_OPTIONS = [
  { value: "phone", label: "Phone call" },
  { value: "text", label: "Text message" },
  { value: "email", label: "Email" },
] as const satisfies readonly Option[];

export type ContactMethod = (typeof CONTACT_METHOD_OPTIONS)[number]["value"];

/** Used for both the best time to reach a lead and a requested appointment time. */
export const TIME_WINDOW_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "anytime", label: "Any time" },
] as const satisfies readonly Option[];

export type TimeWindow = (typeof TIME_WINDOW_OPTIONS)[number]["value"];

/** Pipeline order: New → Contacted → Appointment → Estimate → Won / Lost. */
export const LEAD_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "appointment", label: "Appointment" },
  { value: "estimate", label: "Estimate" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const satisfies readonly Option[];

export type LeadStatus = (typeof LEAD_STATUS_OPTIONS)[number]["value"];

export const APPOINTMENT_STATUS_OPTIONS = [
  { value: "requested", label: "Requested" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const satisfies readonly Option[];

export type AppointmentStatus =
  (typeof APPOINTMENT_STATUS_OPTIONS)[number]["value"];

export const MESSAGE_DIRECTION_OPTIONS = [
  { value: "inbound", label: "Inbound" },
  { value: "outbound", label: "Outbound" },
] as const satisfies readonly Option[];

export type MessageDirection =
  (typeof MESSAGE_DIRECTION_OPTIONS)[number]["value"];

export const MESSAGE_CHANNEL_OPTIONS = [
  { value: "ai", label: "Roofing Advisor" },
  { value: "customer", label: "Homeowner" },
  { value: "email", label: "Email" },
  { value: "sms", label: "Text" },
  { value: "admin", label: "Team" },
] as const satisfies readonly Option[];

export type MessageChannel = (typeof MESSAGE_CHANNEL_OPTIONS)[number]["value"];

export const LEAD_EVENT_TYPE_OPTIONS = [
  { value: "lead_created", label: "Lead created" },
  { value: "assessment_started", label: "Assessment started" },
  { value: "assessment_completed", label: "Assessment completed" },
  { value: "photo_uploaded", label: "Photo uploaded" },
  { value: "email_sent", label: "Email sent" },
  { value: "sms_sent", label: "Text sent" },
  { value: "lead_contacted", label: "Lead contacted" },
  { value: "appointment_requested", label: "Appointment requested" },
  { value: "status_changed", label: "Status changed" },
  { value: "note_added", label: "Note added" },
  { value: "automation_paused", label: "Automation paused" },
  { value: "automation_resumed", label: "Automation resumed" },
] as const satisfies readonly Option[];

export type LeadEventType = (typeof LEAD_EVENT_TYPE_OPTIONS)[number]["value"];
