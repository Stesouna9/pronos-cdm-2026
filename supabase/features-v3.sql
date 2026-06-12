-- ============================================================
--  Features v3 (2026-06-12) : tirs au but (phases finales)
--  + notifications push. Sans danger à relancer (idempotent).
-- ============================================================

-- ---------- ① TIRS AU BUT ----------
-- Sur un match à élimination directe, si tu pronostiques un nul,
-- tu choisis qui gagne aux tirs au but → +2 points bonus si correct.
alter table public.predictions add column if not exists pred_pen_winner text;

create or replace function public.rescore_match()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'fini' and new.score_home is not null and new.score_away is not null then
    update public.predictions p
       set points = public.compute_points(p.pred_home, p.pred_away, new.score_home, new.score_away)
                    * (case when p.confidence then 2 else 1 end)
                    -- bonus tirs au but : prono nul + bon vainqueur t.a.b. = +2 (non doublé)
                    + (case when new.round = 'ko'
                            and new.score_home = new.score_away
                            and new.winner is not null
                            and p.pred_home = p.pred_away
                            and p.pred_pen_winner = new.winner
                       then 2 else 0 end),
           updated_at = now()
     where p.match_id = new.id;
  else
    update public.predictions p set points = null
     where p.match_id = new.id and p.points is not null;
  end if;
  return new;
end; $$;

-- le changement de vainqueur (t.a.b.) doit aussi recalculer les points
drop trigger if exists on_match_scored on public.matches;
create trigger on_match_scored
  after insert or update of status, score_home, score_away, winner, pens_home, pens_away
  on public.matches
  for each row execute function public.rescore_match();

-- ---------- ② NOTIFICATIONS PUSH ----------
-- null = pas encore demandé (la question s'affiche à la prochaine connexion)
alter table public.profiles add column if not exists notify_results boolean;
-- mémorise qu'on a déjà alerté l'admin pour ce match (pas de spam toutes les heures)
alter table public.matches add column if not exists admin_nag_at timestamptz;

create table if not exists public.push_subs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  sub        jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.push_subs enable row level security;
-- chacun gère UNIQUEMENT ses propres abonnements ; l'envoi se fait côté
-- robot avec la clé service_role (qui contourne la RLS).
drop policy if exists push_subs_own on public.push_subs;
create policy push_subs_own on public.push_subs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
