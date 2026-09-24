# Roof One

Website and lead-recovery system for a roofing company.

```
Visitor → Roofing Advisor (assessment) → Lead → Supabase → Admin → optional automation → contact / appointment
```

The public site should read as a trustworthy roofing company. The advisor and
automation are quiet infrastructure behind it, not the look of the site.

**Status:** foundation. Routes, design tokens, the typed data model, the database
schema and component shells are in place. The Roofing Advisor is a working
conversation engine: it runs with no configuration, uses Claude when an API key is
set, and saves conversations and leads to Supabase when Supabase is configured.
Email/SMS aren't connected yet, and the admin still shows placeholder data.

## Getting started

Requires Node.js 20.9 or newer (22 LTS recommended).

```bash
npm install
npm run dev
```

- http://localhost:3000: public site
- http://localhost:3000/admin: admin (placeholder data, no sign-in yet)

No environment variables are required. These are all optional, server-only, and
belong in `.env.local` (never `NEXT_PUBLIC_`):

| Variable                    | What it turns on                                                      |
| --------------------------- | --------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`         | Claude as the advisor's understanding and voice. Without it, the built-in local advisor answers. |
| `ROOFING_ADVISOR_MODEL`     | Overrides the Claude model (default `claude-opus-5`).                  |
| `ROOFING_ADVISOR_PROVIDER`  | Set to `local` to force the local advisor even with a key.             |
| `SUPABASE_URL`              | With the key below, saves conversations, photos and leads to Supabase. Without both, they're kept in memory only. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key. Server-only: it bypasses Row Level Security.        |

| Script              | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Development server                               |
| `npm run build`     | Production build (includes type checking)        |
| `npm run start`     | Serve the production build                       |
| `npm run lint`      | ESLint                                           |
| `npm run typecheck` | Generate route types, then `tsc --noEmit`        |
| `npm test`          | Vitest: the advisor's conversation, pricing, validation and persistence tests |

## Project structure

```
src/
  app/
    layout.tsx             Root layout: fonts, global styles, skip link
    globals.css            Design tokens (Tailwind v4 @theme)
    (site)/                Public site: header + footer layout, homepage
    api/roofing-advisor/   message/ (one chat turn) and photos/ (photo uploads)
    admin/                 Internal lead management
      page.tsx             /admin (overview)
      leads/               /admin/leads, /admin/leads/[id]
      automation/          /admin/automation
      settings/            /admin/settings
  components/
    site/                  Header, floating nav, mobile menu, footer
    home/                  Homepage sections
    roofing-advisor/       The advisor chat: dialog, messages, composer, estimate
    admin/                 Admin UI
    ui/                    Shared primitives (Button, Container, SectionHeading)
  config/site.ts           Company name, phone, navigation (placeholders)
  config/advisor.ts        Company facts the advisor may state (all unset)
  content/home.ts          Homepage copy (placeholders)
  lib/
    leads/                 Lead row types, option lists, priority, data access
    roofing-advisor/       Advisor engine: understanding, state, goals, pricing,
                           AI provider, validation, persistence
    automation/            Automation settings types, action catalog, data access
    placeholder-data.ts    Sample admin data (delete once Supabase is connected)
supabase/
  migrations/              SQL schema
```

## Architecture

- **Two products, one codebase.** The public site (`src/app/(site)`) and the admin
  (`src/app/admin`) have separate layouts and components. They share only the root
  layout, design tokens and domain types.
- **Server Components by default.** Client Components are limited to the mobile
  menu, nav active states, the assessment entry and Roofing Advisor, and the admin nav.
- **The Roofing Advisor is a conversation engine, not a questionnaire.** Each
  message goes to `POST /api/roofing-advisor/message`, where
  `lib/roofing-advisor/engine.ts` runs one turn: read the message and extract every
  fact in it (`extraction.ts`, `intents.ts`), update the structured assessment
  (`assessment.ts`), rank what still matters from a controlled set of goals
  (`goals.ts`), then phrase a short reply. The chat sends the conversation, the
  assessment and its bookkeeping (`AdvisorContext`) with every message.
- **The AI understands and phrases; code decides.** With `ANTHROPIC_API_KEY` set,
  Claude reads the message and writes the reply as strict JSON
  (`providers/anthropic.ts`, `prompts.ts`), choosing among the planner's top goals.
  `validation.ts` rejects anything off-contract: extra keys, a goal that asks for
  something known, prices, company claims, AI or call-center phrasing. Any
  rejection or error falls back to the local advisor (`providers/local.ts`,
  `phrasing.ts`), which also runs the chat when no key is set. State, pricing,
  handoff, completion, events and lead creation are always deterministic.
- **Prices come only from `pricing.ts`.** The AI never states a number. The
  ranges in `PRELIMINARY_PRICING` are placeholders, clearly labeled as a planning
  range in the chat; replace them with Roof One's pricing before launch.
- **One lead per conversation.** Once there's a name and a phone or email, the
  lead is created, then kept current as the conversation continues. The database
  function `upsert_advisor_lead` makes this idempotent. Persistence runs after the
  reply is sent (`after()`), through `lib/roofing-advisor/store`.
- **Events, not integrations.** The advisor emits `LEAD_CREATED`,
  `ASSESSMENT_COMPLETED`, `ESTIMATE_GENERATED`, `PHOTO_UPLOADED`, `HUMAN_REQUESTED`
  and `CONTACT_SUBMITTED` (`events.ts`, stored in `advisor_events`). Automation
  subscribes later; the advisor never talks to email or SMS providers.
- UI components never import the engine, the AI SDK or the store. The chat talks
  to the API through `lib/roofing-advisor/client.ts`.
- **Automation is provider-neutral.** `lib/automation` holds the settings model and
  action catalog. Email and SMS delivery will live behind adapters so providers can
  change without touching the UI.
- **Supabase is the source of truth for leads.** Pages read data only through
  `lib/*/queries.ts`. Those return placeholder data today and will query Supabase
  later, with no UI changes.
- **Types mirror the database.** Row types in `lib/leads/types.ts` use the exact
  column names, and every enum in the migration mirrors an option list in
  `lib/leads/options.ts`. Change them together.
- Lead priority is derived from urgency (`lib/leads/priority.ts`), not stored.
- Automation reaches a lead only when the global switch
  (`automation_settings.enabled`) and the per-lead switch
  (`leads.automation_enabled`) are both on.

## Database

`supabase/migrations/20260923000000_initial_schema.sql` creates:

| Table                 | Purpose                                                           |
| --------------------- | ----------------------------------------------------------------- |
| `leads`               | One row per assessment request                                    |
| `lead_messages`       | Conversation across the advisor, email, SMS and the team          |
| `lead_events`         | Activity timeline (internal notes are `note_added` events)        |
| `lead_photos`         | Storage paths for uploaded photos (files live in Supabase Storage) |
| `appointments`        | Requested visit date, time and status                             |
| `automation_settings` | One row of global automation switches, all off by default         |

`supabase/migrations/20260924000000_roofing_advisor.sql` adds the advisor's tables:

| Table                   | Purpose                                                         |
| ----------------------- | --------------------------------------------------------------- |
| `advisor_conversations` | One row per chat, linked to its lead once there is one          |
| `advisor_messages`      | Every message, with the goal behind each question and photos    |
| `advisor_assessments`   | The latest structured assessment, confidence and estimate       |
| `advisor_events`        | Advisor events for automation to pick up                        |

It also adds `upsert_advisor_lead` (creates the lead once, copies the conversation
and photos into `lead_messages` and `lead_photos`), a trigger that keeps copying
later messages into `lead_messages`, and a private `advisor-photos` Storage bucket.

Row Level Security is on for every table with no policies yet, so nothing can be
read or written with the public key. Policies come with Supabase Auth.

Once a Supabase project exists, apply it with the Supabase CLI:
`supabase link`, then `supabase db push`.

## Design foundation

Tokens live in `src/app/globals.css`:

- **Color:** warm off-white, charcoal, deep muted green, muted clay accent.
  Tailwind's default palette is removed so only these tokens exist. Every text
  pairing meets WCAG AA contrast.
- **Type:** Archivo for display headlines, Instrument Sans for body and UI
  (loaded with `next/font`).
- **Shape:** small radii only, no gradients, and a single shadow reserved for the
  mobile menu overlay.

This is a starting point. The final visual direction comes from the design
references.

## Not built yet

- Admin queries reading from Supabase (the advisor already writes leads, their
  conversation, photos and events there), generated database types, and signed
  URLs for photo thumbnails
- Roof One's real pricing rules in `lib/roofing-advisor/pricing.ts`, and confirmed
  company answers in `config/advisor.ts`
- A shared rate limit for the advisor API (the built-in one is per server instance)
- Supabase Auth for `/admin`, plus RLS policies
- Admin actions: status changes, notes, email/SMS, pause/resume automation
- Email/SMS providers and the follow-up scheduler. Automated texts need recorded
  SMS consent first.
- Real content: company name, phone, service area, photography, projects,
  reviews (real ones only) and FAQs reviewed by the company
- Visual polish from the design references: hero photography, sticky nav, motion
- SEO details that need the real domain and business info: `metadataBase`, Open
  Graph image, sitemap, robots, LocalBusiness structured data
