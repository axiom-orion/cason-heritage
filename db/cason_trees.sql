-- ============================================================
-- cason_trees — per-account family trees (multi-tenant, DB-as-record)
-- ------------------------------------------------------------
-- Run once in the Supabase SQL editor. Each signed-in account owns ONE
-- tree row; row-level security isolates it so a family's record is theirs
-- alone. The tree's source GEDCOM + derived people live in the row, so
-- approval writes to the database (this table), not to git.
-- ============================================================

create table if not exists public.cason_trees (
  id          uuid primary key default gen_random_uuid(),
  owner_email text not null unique,          -- one tree per account (drop unique for multi-tree later)
  name        text,                          -- e.g. "The Reed Line"
  gedcom      text,                          -- the source export (small, canonical)
  tree        jsonb,                         -- the derived { people, eras, directLine }
  updated_at  timestamptz not null default now()
);

alter table public.cason_trees enable row level security;

-- the account may read/write ONLY its own tree (matched on the JWT email)
drop policy if exists "own tree select" on public.cason_trees;
create policy "own tree select" on public.cason_trees
  for select using (owner_email = auth.jwt() ->> 'email');

drop policy if exists "own tree insert" on public.cason_trees;
create policy "own tree insert" on public.cason_trees
  for insert with check (owner_email = auth.jwt() ->> 'email');

drop policy if exists "own tree update" on public.cason_trees;
create policy "own tree update" on public.cason_trees
  for update using (owner_email = auth.jwt() ->> 'email')
             with check (owner_email = auth.jwt() ->> 'email');

drop policy if exists "own tree delete" on public.cason_trees;
create policy "own tree delete" on public.cason_trees
  for delete using (owner_email = auth.jwt() ->> 'email');
