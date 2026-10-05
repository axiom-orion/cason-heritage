# Deployment & CI

## Cloudflare deploy

The site runs as one Cloudflare Worker (`flcason`) with static assets:

- `worker/index.mjs` serves the site, applies the friendly rewrites and headers, upgrades
  http to https (308, with HSTS), folds `www` into the apex, and runs the `api/` functions
  unchanged through a small adapter that gives them Vercel's `(req, res)` shape.
- `scripts/build-site.js` stages the public site into `dist/` from **git-tracked files
  only**, minus server code and tooling. An untracked file in your working copy (uploads,
  drafts, `.dev.vars`) can never be deployed.
- `wrangler.jsonc` binds `dist/` as the assets and claims `flcason.com` + `www.flcason.com`
  as custom domains (the zone must be on the same Cloudflare account).

Deploy from a clean, up-to-date `main`:

```sh
npm install
npx wrangler login     # once per machine
npm run deploy         # build-site + wrangler deploy
```

`npm run preview` runs the same build under `wrangler dev` (add `--local-protocol https`
to `wrangler dev` if you want to click around, since plain http redirects to https).

| Path | Serves |
| --- | --- |
| `/`, `/heritage` | `index.html` — heritage landing |
| `/tree` | `cason-tree.html` — the audit ledger |
| `/dashboard` | `ui_kits/family-tree-app/index.html` — five variants |
| `/living` | `ui_kits/living-line/index.html` — The Living Line (agentic personas) |
| `/living/world` | `ui_kits/living-line/world.html` |
| `/proof`, `/archive` | `ui_kits/proof/`, `ui_kits/archive/` |
| `/demo`, `/try` | `ui_kits/onboarding/index.html` |
| `/deck` | `slides/index.html` — audit deck |
| `/system` | `README.md` |
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

1. **selftests** — the Node selftests (governance, drift, BASIS, agents).
2. **smoke** — Playwright across all surfaces. Artifact: `playwright-report/`.
3. **worker** — builds `dist/` and runs `wrangler deploy --dry-run`, so a broken Worker
   or config fails the PR instead of the deploy.

Production deploys are `npm run deploy` (see above).

## Live AI & multi-model research (optional — `/living`)

The Living Line runs fully offline by default (deterministic templated voices, no
keys, no cost). Two **serverless functions** under `api/` add live capabilities when
you set the matching Worker secrets (`npx wrangler secret put NAME`, then paste the value;
plain settings like `CLAUDE_MODEL` can go in the dashboard as variables). Keys stay
server-side; the browser never sees them.

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
  responses are cached client-side so repeats are free. The functions use only Node
  built-ins (no npm dependencies); they run in the Worker with `nodejs_compat`.
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

Set by `worker/index.mjs` (`withSiteHeaders`):

| Pattern | Cache |
| --- | --- |
| `*.html` | revalidate every request |
| `assets/*` | 1 year, immutable |
| `*.css` | 1 day |

## Production checklist

- [ ] Vendor Inter + Geist Mono + Playfair Display + Source Serif/Sans locally (currently CDN from Google Fonts).
- [ ] Add `og:image` to each entry HTML for link unfurls.
- [x] Custom domains `flcason.com` + `www.flcason.com` (Worker routes in `wrangler.jsonc`).
