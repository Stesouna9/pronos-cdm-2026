-- Cotes de la ligue AVANT match (décision Gabriel, 2026-06-12) : vue agrégée
-- qui ne révèle que les comptes victoire/nul/victoire — jamais les scores
-- exacts des autres joueurs (le verrou RLS sur les pronos reste intact).
-- Appliqué en production. Sans danger à relancer.
create or replace view public.match_cotes as
select p.match_id,
       count(*) as tot,
       count(*) filter (where p.pred_home > p.pred_away) as h,
       count(*) filter (where p.pred_home = p.pred_away) as n,
       count(*) filter (where p.pred_home < p.pred_away) as a
from public.predictions p
join public.profiles pr on pr.id = p.user_id and coalesce(pr.banned, false) = false
group by p.match_id;

grant select on public.match_cotes to anon, authenticated;

-- Scores pronostiqués PAR MATCH, anonymes (demande Gabriel) : on voit les
-- pronos d'un match avant le coup d'envoi, jamais qui les a faits.
create or replace view public.match_pred_scores as
select p.match_id, p.pred_home, p.pred_away, count(*) as nb
from public.predictions p
join public.profiles pr on pr.id = p.user_id and coalesce(pr.banned, false) = false
group by p.match_id, p.pred_home, p.pred_away;

grant select on public.match_pred_scores to anon, authenticated;
