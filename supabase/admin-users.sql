-- ============================================================
--  Gestion des joueurs par l'admin : bannissement.
--  À coller dans Supabase → SQL Editor → Run. Idempotent.
-- ============================================================

-- 1. Colonne "banni"
alter table public.profiles add column if not exists banned boolean not null default false;

-- 2. L'admin peut modifier n'importe quel profil (bannir/débannir).
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- 3. Le classement ignore les bannis.
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
  where not pr.banned
  group by pr.id, pr.pseudo, pr.avatar;
grant select on public.leaderboard to anon, authenticated;

-- 4. Un banni ne peut plus saisir/modifier de prono (en plus du verrou kickoff).
drop policy if exists predictions_insert_own on public.predictions;
create policy predictions_insert_own on public.predictions for insert
  with check (
    auth.uid() = user_id
    and (select kickoff from public.matches where id = match_id) > now()
    and not exists (select 1 from public.profiles b where b.id = auth.uid() and b.banned)
  );

drop policy if exists predictions_update_own on public.predictions;
create policy predictions_update_own on public.predictions for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (select kickoff from public.matches where id = match_id) > now()
    and not exists (select 1 from public.profiles b where b.id = auth.uid() and b.banned)
  );
