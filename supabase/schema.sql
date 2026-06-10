-- ============================================================
--  Pronos CDM 2026 — Schéma Supabase (à coller dans
--  Supabase → SQL Editor → New query → Run).
--  Crée les tables, la sécurité (RLS), le calcul des points
--  et le classement. Sans danger à relancer (idempotent).
-- ============================================================

-- ---------- 1. PROFILS (1 par compte) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  pseudo     text not null default 'Joueur',
  avatar     text not null default '🎯',
  fav        text,                         -- équipe de cœur (code FIFA)
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

-- Crée automatiquement le profil à l'inscription (récupère pseudo/avatar
-- saisis dans le formulaire, stockés dans les "métadonnées" du compte).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, pseudo, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'pseudo', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'avatar', '🎯')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 2. MATCHS (alimentés par l'API foot / l'admin) ----------
create table if not exists public.matches (
  id          text primary key,            -- ex "M01", "K12" ou l'id de l'API
  phase       text not null,               -- "Groupe A", "8es de finale"...
  round       text not null,               -- "group" | "ko"
  grp         text,                         -- lettre de groupe (A..L) ou null
  kickoff     timestamptz not null,
  venue_city  text,
  venue_stade text,
  home        text,                         -- code court (TLA/FIFA, null si inconnu)
  away        text,
  home_name   text,                         -- nom affiché (ex "France")
  away_name   text,
  home_from   text,                         -- "Vainqueur K01" pour le bracket
  away_from   text,
  score_home  int,
  score_away  int,
  pens_home   int,
  pens_away   int,
  status      text not null default 'a_venir', -- 'a_venir' | 'fini'
  winner      text,
  updated_at  timestamptz not null default now()
);

-- ---------- 3. PRONOS (1 par joueur et par match) ----------
create table if not exists public.predictions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  match_id   text not null references public.matches(id) on delete cascade,
  pred_home  int not null,
  pred_away  int not null,
  points     int,                           -- calculé quand le match est fini
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

-- ============================================================
--  CALCUL DES POINTS (le barème, côté serveur = source de vérité)
--  exact = 5 · bon résultat + bon écart = 4 · bon résultat = 3 · raté = 0
-- ============================================================
create or replace function public.compute_points(ph int, pa int, sh int, sa int)
returns int language sql immutable as $$
  select case
    when ph is null or pa is null or sh is null or sa is null then null
    when ph = sh and pa = sa then 5
    when sign(ph - pa) = sign(sh - sa)
      then case when (ph - pa) = (sh - sa) then 4 else 3 end
    else 0
  end;
$$;

-- Quand un match passe à "fini" (ou que son score change), on (re)calcule
-- les points de tous les pronos de ce match.
create or replace function public.rescore_match()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'fini' and new.score_home is not null and new.score_away is not null then
    update public.predictions p
       set points = public.compute_points(p.pred_home, p.pred_away, new.score_home, new.score_away),
           updated_at = now()
     where p.match_id = new.id;
  else
    update public.predictions p
       set points = null
     where p.match_id = new.id and p.points is not null;
  end if;
  return new;
end; $$;

drop trigger if exists on_match_scored on public.matches;
create trigger on_match_scored
  after insert or update of status, score_home, score_away on public.matches
  for each row execute function public.rescore_match();

-- ============================================================
--  CLASSEMENT (agrégé : ne révèle PAS les pronos individuels)
-- ============================================================
create or replace view public.leaderboard as
  select
    pr.id                                            as user_id,
    pr.pseudo,
    pr.avatar,
    coalesce(sum(p.points), 0)                       as pts,
    count(*) filter (where p.points = 5)             as exacts,
    count(*) filter (where p.points in (3,4))        as bons,
    count(*) filter (where p.points is not null)     as joues
  from public.profiles pr
  left join public.predictions p on p.user_id = pr.id
  group by pr.id, pr.pseudo, pr.avatar;

-- ============================================================
--  SÉCURITÉ — Row Level Security
-- ============================================================
alter table public.profiles    enable row level security;
alter table public.matches     enable row level security;
alter table public.predictions enable row level security;

-- PROFILS : tout le monde (connecté) voit les profils (pour le classement),
-- chacun ne modifie que le sien.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (true);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);

-- MATCHS : lecture publique. Écriture réservée aux admins
-- (le cron API utilise la clé "service_role" qui contourne la RLS).
drop policy if exists matches_read on public.matches;
create policy matches_read on public.matches for select using (true);
drop policy if exists matches_admin_write on public.matches;
create policy matches_admin_write on public.matches for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- PRONOS : chacun lit/écrit UNIQUEMENT les siens, et SEULEMENT tant que le
-- coup d'envoi n'est pas passé (verrou anti-triche).
drop policy if exists predictions_read_own on public.predictions;
create policy predictions_read_own on public.predictions for select
  using (auth.uid() = user_id);

drop policy if exists predictions_insert_own on public.predictions;
create policy predictions_insert_own on public.predictions for insert
  with check (
    auth.uid() = user_id
    and (select kickoff from public.matches where id = match_id) > now()
  );

drop policy if exists predictions_update_own on public.predictions;
create policy predictions_update_own on public.predictions for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (select kickoff from public.matches where id = match_id) > now()
  );

-- Le classement (vue) est lisible par tous les connectés.
grant select on public.leaderboard to anon, authenticated;
