# Deployment & CI

## Vercel deploy

This is a pure static site. No build step.

1. Push to GitHub.
2. In Vercel, **Add New… → Project → Import** this repository.
3. **Framework Preset:** *Other*.
4. **Build Command:** *(leave blank)*.
5. **Output Directory:** *(leave blank — root)*.
6. Deploy.

`vercel.json` handles clean URLs and the friendly rewrites:

| Path | Serves |
| --- | --- |
| `/` | `index.html` — heritage landing |
| `/heritage` | `ui_kits/heritage-site/index.html` — the narrative |
| `/tree` | `cason-tree.html` — the audit ledger |
| `/dashboard` | `ui_kits/family-tree-app/index.html` — five variants |
| `/living` | `ui_kits/living-line/index.html` — The Living Line (agentic personas) |
| `/deck` | `slides/index.html` — audit deck |
| `/prompt` | `research/edge-expansion-prompt.md` |

## Local development

```sh
npm install
npm run dev          # serves on http://localhost:4000
```

## Testing

Playwright smoke tests cover page loads, hero rendering, console-error budgets (must be zero), and a handful of interactive paths.

```sh
npm install
npx playwright install --with-deps chromium
npm test             # headless
npm run test:ui      # interactive mode
npm run test:report  # open last HTML report
```

## CI/CD

`.github/workflows/ci.yml` runs three jobs on every push to `main` and every PR:

1. **smoke** — Playwright across all surfaces. Artifact: `playwright-report/`.
2. **lint-html** — fast sanity check that all expected entry points and config files exist.
3. **deploy-preview** — Vercel preview deploy for PRs (gated on `VERCEL_TOKEN` secret).

Production deploys happen automatically via Vercel's git integration once the GitHub repo is connected — no workflow needed for that side.

### Required secrets for `deploy-preview`

- `VERCEL_TOKEN` — personal token from <https://vercel.com/account/tokens>
- `VERCEL_ORG_ID` — from `.vercel/project.json` after first manual deploy
- `VERCEL_PROJECT_ID` — same file

## Live AI & multi-model research (optional — `/living`)

The Living Line runs fully offline by default (deterministic templated voices, no
keys, no cost). Two **serverless functions** under `api/` add live capabilities when
you set the matching environment variables in Vercel (Project → Settings → Environment
Variables). Keys stay server-side; the browser never sees them.

| Endpoint | Feature | Env vars |
| --- | --- | --- |
| `api/persona.js` | Live, in-character dialogue with an ancestor (horizon-bounded — the client only ever sends facts that persona could know) | `ANTHROPIC_API_KEY` · optional `CLAUDE_MODEL` (default `claude-sonnet-4-6`; set to the latest Claude Opus for the highest quality) |
| `api/consensus.js` | **Multi-model research consensus** — asks Grok, Gemini, and Claude the same question in parallel, then a Claude adjudicator corroborates only what ≥2 models agree on (single-source claims are flagged *unverified*) so one model's hallucination can't become fact | any of `ANTHROPIC_API_KEY`, `XAI_API_KEY`, `GEMINI_API_KEY` · optional `XAI_MODEL` (default `grok-4`), `GEMINI_MODEL` (default `gemini-2.5-flash`). The adjudicator needs `ANTHROPIC_API_KEY`. |

Notes:
- The endpoints use whatever providers are configured; with none set they return a
  clear "not configured" message and the UI stays on the offline path.
- Set `XAI_MODEL` / `GEMINI_MODEL` to a model id your key actually supports; a wrong id
  just marks that one provider failed and consensus proceeds with the rest.
- These calls cost tokens (the consensus runs 3–4 frontier-model calls per question);
  responses are cached client-side so repeats are free. The whole site is a static
  deploy with no build step — the functions use only Node built-ins (no npm install).
- Corroborated findings can be saved (browser `localStorage`) as evidence-tiered,
  clearly-labelled "AI consensus" notes — never as `confirmed`, which stays reserved
  for documented genealogical sources.

## Verified family members (roles + avatar)

`/living` has two roles: **narrator** (every guest — observes, asks, researches; their notes stay private to their browser) and **member** (a vetted living family member who can embody an avatar in the 3-D homestead and leave attributed, shared contributions). With no Supabase connected the site is narrator-only and offers a clearly-labelled local "member preview".

To turn on real verification (free):
1. Create a **Free-plan** Supabase organization + project (dashboard → New organization → Free).
2. In the SQL editor, run the migration:
   ```sql
   create table public.cason_members (
     id uuid primary key default gen_random_uuid(),
     email text unique not null,
     display_name text not null,
     generation int,
     approved boolean not null default true,
     created_at timestamptz default now()
   );
   alter table public.cason_members enable row level security;
   create policy "read own membership" on public.cason_members
     for select using (auth.jwt() ->> 'email' = email);

   create table public.cason_contributions (
     id uuid primary key default gen_random_uuid(),
     person_id text not null,
     text text not null,
     question text,
     evidence text default 'possible',
     author_email text not null,
     author_name text not null,
     source text default 'family member',
     created_at timestamptz default now()
   );
   alter table public.cason_contributions enable row level security;
   create policy "public read contributions" on public.cason_contributions for select using (true);
   create policy "members insert own contributions" on public.cason_contributions for insert
     with check (
       auth.jwt() ->> 'email' = author_email
       and exists (select 1 from public.cason_members m where m.email = auth.jwt() ->> 'email' and m.approved)
     );

   -- seed the allowlist with the family members you vet:
   insert into public.cason_members (email, display_name, generation) values ('racason@gmail.com', 'Ryan Cason', 13);
   ```
3. **Auth → URL Configuration:** set the Site URL to `https://flcason.com` and add `https://flcason.com/living` as a redirect.
4. Paste the **Project URL** and the **anon/publishable key** (both public) into `ui_kits/living-line/supabase-config.js` and redeploy.

Members then sign in by email magic-link; only allowlisted emails become members. Add family by inserting more rows into `cason_members`. Contributions are world-readable; only vetted members can write, and only as themselves (enforced by RLS).

## Caching headers

Set by `vercel.json`:

| Pattern | Cache |
| --- | --- |
| `*.html` | revalidate every request |
| `assets/*` | 1 year, immutable |
| `*.css` | 1 day |

## Production checklist

- [ ] Vendor Inter + Geist Mono + Playfair Display + Source Serif/Sans locally (currently CDN from Google Fonts).
- [ ] Add `og:image` to each entry HTML for link unfurls.
- [ ] Configure custom domain in Vercel.
- [ ] Confirm Y-DNA Big Y-700 results landing window (~Jul 2026) — re-run audit and dossiers.
