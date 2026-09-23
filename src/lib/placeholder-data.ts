import type { AutomationSettings } from "@/lib/automation/types";
import type {
  Appointment,
  Lead,
  LeadEvent,
  LeadMessage,
  LeadPhoto,
} from "@/lib/leads/types";

/*
 * PLACEHOLDER DATA — for building the admin before Supabase is connected.
 * Names are fictional, emails use example.com, and phone numbers use the
 * reserved 555-01xx range. Delete this file once queries read from Supabase.
 */

const DANA = "7c1e2a90-3f4b-4d8e-9a61-2b5f0c8d1e01";
const MARCUS = "b2d4f6a8-1c3e-4a5b-8d7f-9e0a1b2c3d02";
const PRIYA = "e5f7a9b1-2d4c-4e6f-a8b0-c1d2e3f4a503";
const TOM = "3a5c7e9f-4b6d-4f8a-9c1e-2f3a4b5c6d04";
const GRACE = "9d1f3b5a-6c8e-4a0b-b2d4-e6f8a0b1c205";
const LUIS = "c8e0a2b4-7d9f-4b1c-8e3a-5b7c9d0e1f06";
const HANNAH = "4f6a8c0e-5b7d-4c9e-a1b3-d5e7f9a0b307";

export const PLACEHOLDER_LEADS: Lead[] = [
  {
    id: DANA,
    created_at: "2026-09-23T13:42:00Z",
    name: "Dana Whitfield",
    email: "dana.whitfield@example.com",
    phone: "(555) 555-0134",
    address: "418 Maple Ave",
    city: "Springfield",
    state: "IL",
    zip_code: "62704",
    issue_type: "leak",
    roof_age: "10_to_20",
    roof_type: "asphalt_shingle",
    urgency: "emergency",
    description:
      "Water is dripping from the ceiling in the upstairs hallway after last night’s rain. There’s a brown stain about two feet wide.",
    preferred_contact_method: "phone",
    preferred_time: "morning",
    status: "new",
    automation_enabled: true,
  },
  {
    id: HANNAH,
    created_at: "2026-09-23T09:15:00Z",
    name: "Hannah Brooks",
    email: null,
    phone: "(555) 555-0188",
    address: "27 Orchard Ln",
    city: "Fairview",
    state: "TN",
    zip_code: "37062",
    issue_type: "storm_damage",
    roof_age: "unknown",
    roof_type: "unknown",
    urgency: "soon",
    description: "A tree limb came down on the back of the roof.",
    preferred_contact_method: "text",
    preferred_time: "anytime",
    status: "new",
    automation_enabled: true,
  },
  {
    id: MARCUS,
    created_at: "2026-09-22T16:30:00Z",
    name: "Marcus Bell",
    email: "marcus.bell@example.com",
    phone: "(555) 555-0147",
    address: "1190 Ridge Rd",
    city: "Riverside",
    state: "OH",
    zip_code: "45431",
    issue_type: "storm_damage",
    roof_age: "over_20",
    roof_type: "asphalt_shingle",
    urgency: "soon",
    description:
      "Several shingles blew off during Sunday’s storm. A few are in the yard.",
    preferred_contact_method: "text",
    preferred_time: "evening",
    status: "contacted",
    automation_enabled: true,
  },
  {
    id: PRIYA,
    created_at: "2026-09-21T11:05:00Z",
    name: "Priya Raman",
    email: "priya.raman@example.com",
    phone: "(555) 555-0162",
    address: "85 Birch Ct",
    city: "Franklin",
    state: "WI",
    zip_code: "53132",
    issue_type: "inspection",
    roof_age: "5_to_10",
    roof_type: "metal",
    urgency: "planning",
    description:
      "We’re buying this house and want to know the roof’s condition before closing.",
    preferred_contact_method: "email",
    preferred_time: "afternoon",
    status: "appointment",
    automation_enabled: false,
  },
  {
    id: TOM,
    created_at: "2026-09-18T15:20:00Z",
    name: "Tom Alvarez",
    email: "tom.alvarez@example.com",
    phone: "(555) 555-0121",
    address: "3021 Cedar St",
    city: "Springfield",
    state: "IL",
    zip_code: "62702",
    issue_type: "replacement",
    roof_age: "over_20",
    roof_type: "asphalt_shingle",
    urgency: "planning",
    description:
      "The roof is original to the house, about 25 years old. Thinking about replacing it before winter.",
    preferred_contact_method: "phone",
    preferred_time: "morning",
    status: "estimate",
    automation_enabled: true,
  },
  {
    id: GRACE,
    created_at: "2026-09-12T10:48:00Z",
    name: "Grace Kim",
    email: "grace.kim@example.com",
    phone: "(555) 555-0175",
    address: "602 Willow Way",
    city: "Riverside",
    state: "OH",
    zip_code: "45432",
    issue_type: "repair",
    roof_age: "10_to_20",
    roof_type: "tile",
    urgency: "soon",
    description: "A few cracked tiles near the chimney.",
    preferred_contact_method: "email",
    preferred_time: "anytime",
    status: "won",
    automation_enabled: false,
  },
  {
    id: LUIS,
    created_at: "2026-09-08T18:02:00Z",
    name: "Luis Ortega",
    email: "luis.ortega@example.com",
    phone: null,
    address: null,
    city: "Fairview",
    state: "TN",
    zip_code: "37062",
    issue_type: "not_sure",
    roof_age: "unknown",
    roof_type: "unknown",
    urgency: null,
    description: "Noticed granules in the gutters and some dark streaks.",
    preferred_contact_method: "email",
    preferred_time: null,
    status: "lost",
    automation_enabled: false,
  },
];

export const PLACEHOLDER_MESSAGES: LeadMessage[] = [
  {
    id: "0a1b2c3d-0001-4000-8000-000000000001",
    lead_id: DANA,
    direction: "outbound",
    channel: "ai",
    message:
      "Thanks, Dana. Your request is with the team, including your photos.",
    created_at: "2026-09-23T13:42:30Z",
  },
  {
    id: "0a1b2c3d-0001-4000-8000-000000000002",
    lead_id: DANA,
    direction: "outbound",
    channel: "sms",
    message:
      "Hi Dana, this is the roofing team. We got your request about the leak. Is now a good time to call?",
    created_at: "2026-09-23T13:51:00Z",
  },
  {
    id: "0a1b2c3d-0001-4000-8000-000000000003",
    lead_id: DANA,
    direction: "inbound",
    channel: "sms",
    message: "Yes, any time before noon works.",
    created_at: "2026-09-23T13:53:00Z",
  },
  {
    id: "0a1b2c3d-0001-4000-8000-000000000004",
    lead_id: MARCUS,
    direction: "outbound",
    channel: "admin",
    message: "Called and left a voicemail. Will try again this evening.",
    created_at: "2026-09-22T17:10:00Z",
  },
];

export const PLACEHOLDER_EVENTS: LeadEvent[] = [
  {
    id: "0b1c2d3e-0001-4000-8000-000000000001",
    lead_id: DANA,
    event_type: "assessment_started",
    metadata: {},
    created_at: "2026-09-23T13:36:00Z",
  },
  {
    id: "0b1c2d3e-0001-4000-8000-000000000002",
    lead_id: DANA,
    event_type: "photo_uploaded",
    metadata: { count: 2 },
    created_at: "2026-09-23T13:40:00Z",
  },
  {
    id: "0b1c2d3e-0001-4000-8000-000000000003",
    lead_id: DANA,
    event_type: "assessment_completed",
    metadata: {},
    created_at: "2026-09-23T13:42:00Z",
  },
  {
    id: "0b1c2d3e-0001-4000-8000-000000000004",
    lead_id: DANA,
    event_type: "lead_created",
    metadata: {},
    created_at: "2026-09-23T13:42:00Z",
  },
  {
    id: "0b1c2d3e-0001-4000-8000-000000000005",
    lead_id: DANA,
    event_type: "sms_sent",
    metadata: { sent_by: "team" },
    created_at: "2026-09-23T13:51:00Z",
  },
  {
    id: "0b1c2d3e-0001-4000-8000-000000000006",
    lead_id: DANA,
    event_type: "note_added",
    metadata: {
      note: "Active leak. Bring tarps in case a temporary cover is needed.",
    },
    created_at: "2026-09-23T13:55:00Z",
  },
  {
    id: "0b1c2d3e-0001-4000-8000-000000000007",
    lead_id: MARCUS,
    event_type: "lead_created",
    metadata: {},
    created_at: "2026-09-22T16:30:00Z",
  },
  {
    id: "0b1c2d3e-0001-4000-8000-000000000008",
    lead_id: MARCUS,
    event_type: "status_changed",
    metadata: { from: "new", to: "contacted" },
    created_at: "2026-09-22T17:10:00Z",
  },
  {
    id: "0b1c2d3e-0001-4000-8000-000000000009",
    lead_id: PRIYA,
    event_type: "lead_created",
    metadata: {},
    created_at: "2026-09-21T11:05:00Z",
  },
  {
    id: "0b1c2d3e-0001-4000-8000-000000000010",
    lead_id: PRIYA,
    event_type: "appointment_requested",
    metadata: {},
    created_at: "2026-09-21T11:05:00Z",
  },
  {
    id: "0b1c2d3e-0001-4000-8000-000000000011",
    lead_id: PRIYA,
    event_type: "automation_paused",
    metadata: {},
    created_at: "2026-09-21T14:30:00Z",
  },
];

export const PLACEHOLDER_PHOTOS: LeadPhoto[] = [
  {
    id: "0c1d2e3f-0001-4000-8000-000000000001",
    lead_id: DANA,
    storage_path: `leads/${DANA}/hallway-ceiling.jpg`,
    created_at: "2026-09-23T13:40:00Z",
  },
  {
    id: "0c1d2e3f-0001-4000-8000-000000000002",
    lead_id: DANA,
    storage_path: `leads/${DANA}/attic-decking.jpg`,
    created_at: "2026-09-23T13:40:00Z",
  },
];

export const PLACEHOLDER_APPOINTMENTS: Appointment[] = [
  {
    id: "0d1e2f3a-0001-4000-8000-000000000001",
    lead_id: DANA,
    requested_date: "2026-09-24",
    requested_time: "morning",
    status: "requested",
    notes: null,
    created_at: "2026-09-23T13:42:00Z",
  },
  {
    id: "0d1e2f3a-0001-4000-8000-000000000002",
    lead_id: PRIYA,
    requested_date: "2026-09-26",
    requested_time: "afternoon",
    status: "confirmed",
    notes: "Buyer’s agent will be on site.",
    created_at: "2026-09-21T11:05:00Z",
  },
];

export const PLACEHOLDER_AUTOMATION_SETTINGS: AutomationSettings = {
  id: 1,
  enabled: false,
  confirmation_email: true,
  confirmation_sms: true,
  missed_call_followup: false,
  followup_30m: true,
  followup_24h: true,
  followup_72h: false,
};
