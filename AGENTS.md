<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project notes

Roofing company website + lead-recovery system. See README.md for structure and status.

- The public site (`src/app/(site)`) and the admin (`src/app/admin`) stay separate. They share only domain types and design tokens.
- Server Components by default. Add `"use client"` only where interaction needs it.
- UI components never import AI, email, or SMS vendor SDKs. Provider code lives behind adapters in `src/lib/`.
- Pages read data only through `src/lib/**/queries.ts`. Supabase is the source of truth for leads.
- Enum values in `supabase/migrations` mirror the option lists in `src/lib/leads/options.ts` (advisor tables: the lists named in the advisor migration). Change both together.
- Colors, radii and shadows come from the tokens in `src/app/globals.css` (Tailwind defaults are cleared). No gradients, glows, or glassmorphism.
- Public copy makes no unconfirmed claims: ratings, certifications, warranties, years in business, or service areas.
- Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` before pushing.
