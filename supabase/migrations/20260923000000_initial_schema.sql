-- Initial schema for the roofing lead-recovery system.
--
-- Supabase is the source of truth for leads. Enum values mirror the option
-- lists in src/lib/leads/options.ts; change both together.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.lead_status as enum (
  'new', 'contacted', 'appointment', 'estimate', 'won', 'lost'
);

create type public.roof_issue_type as enum (
  'leak', 'storm_damage', 'repair', 'replacement', 'inspection', 'not_sure'
);

create type public.lead_urgency as enum ('emergency', 'soon', 'planning');

create type public.roof_age_range as enum (
  'under_5', '5_to_10', '10_to_20', 'over_20', 'unknown'
);

create type public.roof_type as enum (
  'asphalt_shingle', 'metal', 'tile', 'flat', 'other', 'unknown'
);

create type public.contact_method as enum ('phone', 'text', 'email');

create type public.time_window as enum (
  'morning', 'afternoon', 'evening', 'anytime'
);

create type public.message_direction as enum ('inbound', 'outbound');

create type public.message_channel as enum (
  'ai', 'customer', 'email', 'sms', 'admin'
);

create type public.lead_event_type as enum (
  'lead_created',
  'assessment_started',
  'assessment_completed',
  'photo_uploaded',
  'email_sent',
  'sms_sent',
  'lead_contacted',
  'appointment_requested',
  'status_changed',
  'note_added',
  'automation_paused',
  'automation_resumed'
);

create type public.appointment_status as enum (
  'requested', 'confirmed', 'completed', 'cancelled'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  issue_type public.roof_issue_type not null,
  roof_age public.roof_age_range,
  roof_type public.roof_type,
  urgency public.lead_urgency,
  description text,
  preferred_contact_method public.contact_method,
  preferred_time public.time_window,
  status public.lead_status not null default 'new',
  -- Per-lead switch. Messages only go out when automation_settings.enabled is also true.
  automation_enabled boolean not null default true,
  constraint leads_contact_required check (phone is not null or email is not null)
);

create index leads_created_at_idx on public.leads (created_at desc);
create index leads_status_created_at_idx on public.leads (status, created_at desc);

create table public.lead_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  direction public.message_direction not null,
  channel public.message_channel not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index lead_messages_lead_id_created_at_idx
  on public.lead_messages (lead_id, created_at);

create table public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  event_type public.lead_event_type not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index lead_events_lead_id_created_at_idx
  on public.lead_events (lead_id, created_at);

-- Files live in Supabase Storage; this table records where.
create table public.lead_photos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index lead_photos_lead_id_idx on public.lead_photos (lead_id);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  requested_date date,
  requested_time public.time_window,
  status public.appointment_status not null default 'requested',
  notes text,
  created_at timestamptz not null default now()
);

create index appointments_lead_id_idx on public.appointments (lead_id);

-- Global automation switches. Exactly one row. Everything starts off:
-- automation is opt-in.
create table public.automation_settings (
  id smallint primary key default 1
    constraint automation_settings_single_row check (id = 1),
  enabled boolean not null default false,
  confirmation_email boolean not null default false,
  confirmation_sms boolean not null default false,
  missed_call_followup boolean not null default false,
  followup_30m boolean not null default false,
  followup_24h boolean not null default false,
  followup_72h boolean not null default false
);

insert into public.automation_settings (id) values (1);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Enabled on every table with no policies yet, so the anon and authenticated
-- roles can't read or write anything. Server code using the service role
-- bypasses RLS. Admin access policies come with Supabase Auth.
-- ---------------------------------------------------------------------------

alter table public.leads enable row level security;
alter table public.lead_messages enable row level security;
alter table public.lead_events enable row level security;
alter table public.lead_photos enable row level security;
alter table public.appointments enable row level security;
alter table public.automation_settings enable row level security;
