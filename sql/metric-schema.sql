-- The Metric Is the Walls -- gated preview reader.
-- Apply once, in the Supabase SQL editor for the cason-heritage project.
--
-- ── WHY EVERY TABLE IS RLS-ON WITH NO POLICIES ──────────────────────────────────────────────
-- The browser never gets a Supabase key of any kind. It talks only to /api/metric-*, which holds
-- the service-role key server-side and re-checks the preview key on every single call. RLS on with
-- zero policies means that even if an anon key leaked from somewhere else on the site, none of
-- these tables are reachable with it. The service role bypasses RLS by design, which is the only
-- path in.
--
-- ⛔ THE MANUSCRIPT LIVES HERE AND NOT IN THE SITE REPO. cason-heritage deploys with
-- outputDirectory ".", so anything committed there is publicly fetchable regardless of what the
-- page does. That is the whole reason the text is in a database instead of a file.

-- ── 1. WHO CAN READ IT ──────────────────────────────────────────────────────────────────────
-- Keys are stored HASHED. A leak of this table hands somebody a list of who has access and no way
-- to use it. The plaintext key is printed once, by web-sync.sh, and never stored anywhere.
create table if not exists metric_keys (
  id           uuid primary key default gen_random_uuid(),
  key_hash     text not null unique,
  label        text not null,               -- who it was issued to; appears on their notes
  note         text,                        -- why they have it
  created_at   timestamptz not null default now(),
  expires_at   timestamptz,                 -- null = no expiry
  revoked      boolean not null default false,
  last_seen_at timestamptz,
  uses         integer not null default 0
);
alter table metric_keys enable row level security;

-- ── 2. THE BOOK ─────────────────────────────────────────────────────────────────────────────
-- One row per piece. blocks is the paragraph array from make-web.sh, each paragraph carrying the
-- FRAGMENT that a note is filed against. Replaced wholesale on every push, so the reader can never
-- be older than the manuscript.
create table if not exists metric_pieces (
  file        text primary key,             -- e.g. 19-the-system-is-the-floor.md
  n           text not null,                -- two-digit order prefix
  slug        text not null,
  title       text not null,
  words       integer,
  audio       text,                         -- object name in the metric-audio bucket, or null
  blocks      jsonb not null,
  bundle_hash text,
  updated_at  timestamptz not null default now()
);
alter table metric_pieces enable row level security;
create index if not exists metric_pieces_n_idx on metric_pieces (n);

-- ── 3. WHAT COMES BACK ──────────────────────────────────────────────────────────────────────
-- ⭐ THE SHAPE OF THIS TABLE IS THE PIPELINE RULING MADE PHYSICAL. HANDOFF: notes come in as
-- "file, line, short fragment, comment -- then it is a lookup, not a transcription." Every silent
-- edit this project suffered arrived because a note travelled inside a copy of the prose. There is
-- deliberately NO column here that can hold a rewritten paragraph: `selected` is what the reader
-- highlighted and `comment` is what they said about it. Nothing round-trips as prose.
create table if not exists metric_notes (
  id         bigserial primary key,
  created_at timestamptz not null default now(),
  key_label  text not null,                 -- who wrote it, from the key they used
  file       text not null,
  frag       text,                          -- first seven words of the paragraph -- the anchor
  occ        integer not null default 0,    -- which occurrence, when a fragment repeats
  selected   text,                          -- the exact span they highlighted, if any
  comment    text not null,
  kind       text not null default 'observation'
             check (kind in ('correction', 'observation', 'suggestion')),
  status     text not null default 'new'
             check (status in ('new', 'pulled', 'done')),
  pulled_at  timestamptz
);
alter table metric_notes enable row level security;
create index if not exists metric_notes_status_idx on metric_notes (status, created_at);
create index if not exists metric_notes_file_idx   on metric_notes (file);

-- ── 4. THE STORAGE BUCKET FOR AUDIO ─────────────────────────────────────────────────────────
-- PRIVATE. The reader never receives a bucket URL, only a signed link minted per request after the
-- key has been checked, expiring in an hour. A public bucket would be the same defect as putting
-- the text in the repo: the gate would be decorative.
insert into storage.buckets (id, name, public)
values ('metric-audio', 'metric-audio', false)
on conflict (id) do nothing;
