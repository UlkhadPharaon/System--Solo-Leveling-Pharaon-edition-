-- Supabase migration — run in the Supabase SQL editor.
-- Tables needed by the local-first sync engine (src/lib/supabaseSync.ts),
-- the Domain engine, the habit checklist and the world leaderboard.

-- ── 1. Cloud sync blob (all aura_* localStorage keys, last-write-wins) ──────
create table if not exists public.user_state (
  uid uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  client_updated_ms bigint not null default 0
);

alter table public.user_state enable row level security;

create policy "own user_state" on public.user_state
  for all using (auth.uid() = uid) with check (auth.uid() = uid);

-- ── 2. Domains (adaptive domain engine — mirrors src/lib/domains.ts) ────────
create table if not exists public.domains (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  label text not null,
  category text not null check (category in
    ('physical','creative','intellectual','craft','habit','financial','social')),
  tracking_type text not null check (tracking_type in
    ('workout_log','project_phases','study_subjects','focus_sessions','budget_bucket','habit_checklist')),
  icon_ref text not null default 'check-circle',
  color_accent text not null default '#06b6d4',
  goal_text text not null default '',
  target_metric jsonb,
  weekly_time_budget numeric,
  created_at timestamptz not null default now()
);

alter table public.domains enable row level security;

create policy "own domains" on public.domains
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 3. World leaderboard (flat columns; avatar kept as jsonb) ───────────────
create table if not exists public.leaderboard (
  user_id uuid primary key references auth.users(id) on delete cascade,
  user_name text not null,
  level int not null default 1,
  rank text not null default 'E',
  hunter_class text not null default 'Chasseur de Rang E (Débutant)',
  total_xp bigint not null default 0,
  avatar jsonb not null default '{}'::jsonb
);

alter table public.leaderboard enable row level security;

-- Anonymous users can read the leaderboard, only write their own row.
create policy "leaderboard readable" on public.leaderboard
  for select using (true);
create policy "own leaderboard row" on public.leaderboard
  for insert with check (auth.uid() = user_id);
create policy "update own leaderboard row" on public.leaderboard
  for update using (auth.uid() = user_id);

-- ── 4. Enable anonymous sign-ins ────────────────────────────────────────────
-- Dashboard → Authentication → Providers → Anonymous: turn ON.
