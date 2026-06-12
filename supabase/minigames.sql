-- ============================================================
--  Mini-jeux (2026-06-12) : scores quotidiens, classement Jeux,
--  bonus +10 (1er du classement Jeux avant les quarts).
--  Sans danger à relancer (idempotent).
-- ============================================================

-- 1 ligne = 1 partie. UNIQUE (user, jeu, jour) + insert-only (pas d'update)
-- = un seul essai par jour, verrouillé côté serveur.
create table if not exists public.minigame_scores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  game       text not null,
  day        date not null,
  score      int  not null default 0,
  won        boolean not null default false,  -- défi du jour réussi → +1
  created_at timestamptz not null default now(),
  unique (user_id, game, day)
);

alter table public.minigame_scores enable row level security;

-- lecture par tous les connectés (classement + records de la ligue)
drop policy if exists minigame_read on public.minigame_scores;
create policy minigame_read on public.minigame_scores for select using (true);

-- insertion : uniquement SA propre partie, joueur non banni.
-- Pas de policy UPDATE/DELETE → impossible de rejouer ou retoucher un score.
drop policy if exists minigame_insert_own on public.minigame_scores;
create policy minigame_insert_own on public.minigame_scores for insert
  with check (
    auth.uid() = user_id
    and not exists (select 1 from public.profiles where id = auth.uid() and banned)
  );

-- Classement Jeux : 1 point par défi réussi.
create or replace view public.games_leaderboard as
  select pr.id as user_id, pr.pseudo, pr.avatar,
         coalesce(sum(case when s.won then 1 else 0 end), 0) as pts,
         count(s.id) as parties
  from public.profiles pr
  left join public.minigame_scores s on s.user_id = pr.id
  where coalesce(pr.banned, false) = false
  group by pr.id, pr.pseudo, pr.avatar;

grant select on public.games_leaderboard to anon, authenticated;

-- Bonus au classement GÉNÉRAL (ex : +10 au 1er du classement Jeux avant
-- les quarts — à attribuer à ce moment-là via Admin/SQL).
alter table public.profiles add column if not exists bonus_pts int not null default 0;

-- (mêmes colonnes et même ordre que la vue existante — seul pts change)
create or replace view public.leaderboard as
  select
    pr.id                                            as user_id,
    pr.pseudo,
    pr.avatar,
    pr.created_at,
    coalesce(sum(p.points), 0) + coalesce(pr.bonus_pts, 0) as pts,
    count(*) filter (where p.points = 5)             as exacts,
    count(*) filter (where p.points in (3,4))        as bons,
    count(*) filter (where p.points is not null)     as joues
  from public.profiles pr
  left join public.predictions p on p.user_id = pr.id
  where not pr.banned
  group by pr.id, pr.pseudo, pr.avatar, pr.created_at, pr.bonus_pts;
