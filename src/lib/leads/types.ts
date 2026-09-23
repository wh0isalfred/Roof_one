import type {
  AppointmentStatus,
  ContactMethod,
  IssueType,
  LeadEventType,
  LeadStatus,
  MessageChannel,
  MessageDirection,
  RoofAge,
  RoofType,
  TimeWindow,
  Urgency,
} from "./options";

/*
 * Row types for the lead tables in supabase/migrations. Field names match the
 * column names exactly so Supabase query results can be used without mapping.
 */

/** ISO 8601 timestamp, as Supabase returns `timestamptz` columns. */
export type Timestamp = string;

/** ISO 8601 calendar date (YYYY-MM-DD), as Supabase returns `date` columns. */
export type CalendarDate = string;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** `public.leads` */
export interface Lead {
  id: string;
  created_at: Timestamp;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  issue_type: IssueType;
  roof_age: RoofAge | null;
  roof_type: RoofType | null;
  urgency: Urgency | null;
  description: string | null;
  preferred_contact_method: ContactMethod | null;
  preferred_time: TimeWindow | null;
  status: LeadStatus;
  /** Per-lead switch. Messages only go out when global automation is also on. */
  automation_enabled: boolean;
}

/**
 * Insert shape for `public.leads`. The database fills in `id` and
 * `created_at`; `status` and `automation_enabled` have column defaults.
 */
export type NewLead = Pick<Lead, "name" | "issue_type"> &
  Partial<Omit<Lead, "id" | "created_at" | "name" | "issue_type">>;

/** `public.lead_messages` */
export interface LeadMessage {
  id: string;
  lead_id: string;
  direction: MessageDirection;
  channel: MessageChannel;
  message: string;
  created_at: Timestamp;
}

/** `public.lead_events` */
export interface LeadEvent {
  id: string;
  lead_id: string;
  event_type: LeadEventType;
  metadata: { [key: string]: Json | undefined };
  created_at: Timestamp;
}

/** `public.lead_photos`. The file itself lives in Supabase Storage. */
export interface LeadPhoto {
  id: string;
  lead_id: string;
  storage_path: string;
  created_at: Timestamp;
}

/** `public.appointments` */
export interface Appointment {
  id: string;
  lead_id: string;
  requested_date: CalendarDate | null;
  requested_time: TimeWindow | null;
  status: AppointmentStatus;
  notes: string | null;
  created_at: Timestamp;
}

/** A lead with its related rows, as the admin lead detail page needs it. */
export interface LeadDetail extends Lead {
  messages: LeadMessage[];
  events: LeadEvent[];
  photos: LeadPhoto[];
  appointments: Appointment[];
}
