# Roof One

Website and lead-recovery system for a roofing company.

```
Visitor → Roofing Advisor (assessment) → Lead → Supabase → Admin → optional automation → contact / appointment
```

The public site should read as a trustworthy roofing company. The advisor and
automation are quiet infrastructure behind it, not the look of the site.

**Status:** foundation. Routes, design tokens, the typed data model, the database
schema and component shells are in place. Nothing is connected to Supabase, an AI
provider, or email/SMS yet, and the admin shows placeholder data.

## Getting started

Requires Node.js 20.9 or newer (22 LTS recommended).

```bash
npm install
npm run dev
```

- http://localhost:3000: public site
- http://localhost:3000/admin: admin (placeholder data, no sign-in yet)

No environment variables are needed yet.

| Script              | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Development server                               |
| `npm run build`     | Production build (includes type checking)        |
| `npm run start`     | Serve the production build                       |
| `npm run lint`      | ESLint                                           |
| `npm run typecheck` | Generate route types, then `tsc --noEmit`        |

## Project structure

```
src/
  app/
    layout.tsx             Root layout: fonts, global styles, skip link
    globals.css            Design tokens (Tailwind v4 @theme)
    (site)/                Public site: header + footer layout, homepage
    admin/                 Internal lead management
      page.tsx             /admin (overview)
      leads/               /admin/leads, /admin/leads/[id]
      automation/          /admin/automation
      settings/            /admin/settings
  components/
    site/                  Header, floating nav, mobile menu, footer
    home/                  Homepage sections
    roofing-advisor/       Reusable assessment components
    admin/                 Admin UI
    ui/                    Shared primitives (Button, Container, SectionHeading)
  config/site.ts           Company name, phone, navigation (placeholders)
  content/home.ts          Homepage copy (placeholders)
  lib/
    leads/                 Lead row types, option lists, priority, data access
    advisor/               Assessment answer types, step config, helpers
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
  menu, nav active states, the Roofing Advisor and the buttons that open it, the
  service details, the before/after slider, and the admin nav.
- **The homepage introduces the assessment; it doesn't contain it.** Every
  "Start your assessment" button opens the Roofing Advisor as a full-screen
  guided flow (`AdvisorDialog`), keeping answers if the visitor closes and comes back.
- **The Roofing Advisor is a scripted flow.** Steps are data in
  `lib/advisor/steps.ts`, rendered by vendor-neutral components. It works without
  any AI provider. AI help, when added, sits behind a server-only adapter and is
  never imported by UI components.
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

Row Level Security is on for every table with no policies yet, so nothing can be
read or written with the public key. Policies come with Supabase Auth.

Once a Supabase project exists, apply it with the Supabase CLI:
`supabase link`, then `supabase db push`.

## Design foundation

Tokens live in `src/app/globals.css`:

- **Color:** white, near black (`#0A0D12`) and one strong blue. Primary blue
  (`#0757C9`) marks actions, selected states and the closing call-to-action field;
  deep blue (`#062B63`) is the header, dark sections and footer; the cool surface
  (`#F3F7FC`) is used sparingly. Roughly 65–75% white, 15–25% deep blue, 5–15%
  primary blue. Orange is kept for admin status signals only. Tailwind's default
  palette is removed so only these tokens exist. Every text pairing meets WCAG AA
  contrast.
- **Type:** Archivo (variable weight and width, loaded with `next/font`), widened
  and heavy for headlines (`font-headline`). The scale is `text-display` (hero
  only), `text-heading` (section titles), `text-heading-lg` (closing call to
  action), then the default `text-lg` / `text-base` / `text-sm`. Headings carry
  each section on their own: no eyebrow labels above them.
- **Shape:** small radii only, no gradients, and a single shadow reserved for
  floating layers (dialogs, the advisor launcher, the slider handle).

## Not built yet

- Supabase client, environment variables, generated types, and lead creation from
  the advisor (Server Action), including photo upload to Storage
- Supabase Auth for `/admin`, plus RLS policies
- Admin actions: status changes, notes, email/SMS, pause/resume automation
- Email/SMS providers and the follow-up scheduler. Automated texts need recorded
  SMS consent first.
- Optional AI assistance for the advisor
- Real content: company name, phone, service area, photography, projects,
  reviews (real ones only) and FAQs reviewed by the company
- Visual polish from the design references: hero photography, sticky nav, motion
- SEO details that need the real domain and business info: `metadataBase`, Open
  Graph image, sitemap, robots, LocalBusiness structured data
