-- ============================================================
--  Pronos CDM 2026 — VRAIS matchs (1re semaine, 11→18 juin 2026)
--  Source : calendrier officiel (groupes A–L réels du tirage déc. 2025).
--  Heures en UTC (ET = UTC-4 en juin). À coller dans Supabase → SQL Editor.
--  Idempotent : ON CONFLICT met à jour.
-- ============================================================
insert into public.matches
  (id, phase, round, grp, kickoff, venue_city, venue_stade, home, away, home_name, away_name, status)
values
  ('WC001','Groupe A','group','A','2026-06-11T19:00:00Z','Mexico','Estadio Azteca','MEX','RSA','Mexique','Afrique du Sud','a_venir'),
  ('WC002','Groupe A','group','A','2026-06-12T02:00:00Z','Guadalajara','Estadio Akron','KOR','CZE','Corée du Sud','Tchéquie','a_venir'),
  ('WC003','Groupe B','group','B','2026-06-12T19:00:00Z','Toronto','BMO Field','CAN','BIH','Canada','Bosnie-Herz.','a_venir'),
  ('WC004','Groupe D','group','D','2026-06-13T01:00:00Z','Los Angeles','SoFi Stadium','USA','PAR','États-Unis','Paraguay','a_venir'),
  ('WC005','Groupe B','group','B','2026-06-13T19:00:00Z','San Francisco','Levi''s Stadium','QAT','SUI','Qatar','Suisse','a_venir'),
  ('WC006','Groupe C','group','C','2026-06-13T22:00:00Z','New York / NJ','MetLife Stadium','BRA','MAR','Brésil','Maroc','a_venir'),
  ('WC007','Groupe C','group','C','2026-06-14T01:00:00Z','Boston','Gillette Stadium','HAI','SCO','Haïti','Écosse','a_venir'),
  ('WC008','Groupe D','group','D','2026-06-14T04:00:00Z','Vancouver','BC Place','AUS','TUR','Australie','Türkiye','a_venir'),
  ('WC009','Groupe E','group','E','2026-06-14T17:00:00Z','Houston','NRG Stadium','GER','CUW','Allemagne','Curaçao','a_venir'),
  ('WC010','Groupe F','group','F','2026-06-14T20:00:00Z','Dallas','AT&T Stadium','NED','JPN','Pays-Bas','Japon','a_venir'),
  ('WC011','Groupe E','group','E','2026-06-14T23:00:00Z','Philadelphie','Lincoln Financial Field','CIV','ECU','Côte d''Ivoire','Équateur','a_venir'),
  ('WC012','Groupe F','group','F','2026-06-15T02:00:00Z','Monterrey','Estadio BBVA','SWE','TUN','Suède','Tunisie','a_venir'),
  ('WC013','Groupe H','group','H','2026-06-15T17:00:00Z','Atlanta','Mercedes-Benz Stadium','ESP','CPV','Espagne','Cap-Vert','a_venir'),
  ('WC014','Groupe G','group','G','2026-06-15T22:00:00Z','Seattle','Lumen Field','BEL','EGY','Belgique','Égypte','a_venir'),
  ('WC015','Groupe H','group','H','2026-06-15T22:00:00Z','Miami','Hard Rock Stadium','KSA','URU','Arabie saoudite','Uruguay','a_venir'),
  ('WC016','Groupe G','group','G','2026-06-16T04:00:00Z','Los Angeles','SoFi Stadium','IRN','NZL','Iran','Nouvelle-Zélande','a_venir'),
  ('WC017','Groupe I','group','I','2026-06-16T19:00:00Z','New York / NJ','MetLife Stadium','FRA','SEN','France','Sénégal','a_venir'),
  ('WC018','Groupe I','group','I','2026-06-16T22:00:00Z','Boston','Gillette Stadium','IRQ','NOR','Irak','Norvège','a_venir'),
  ('WC019','Groupe J','group','J','2026-06-17T01:00:00Z','Kansas City','Arrowhead Stadium','ARG','ALG','Argentine','Algérie','a_venir'),
  ('WC020','Groupe J','group','J','2026-06-17T04:00:00Z','San Francisco','Levi''s Stadium','AUT','JOR','Autriche','Jordanie','a_venir'),
  ('WC021','Groupe K','group','K','2026-06-17T17:00:00Z','Houston','NRG Stadium','POR','COD','Portugal','RD Congo','a_venir'),
  ('WC022','Groupe L','group','L','2026-06-17T20:00:00Z','Dallas','AT&T Stadium','ENG','CRO','Angleterre','Croatie','a_venir'),
  ('WC023','Groupe L','group','L','2026-06-17T23:00:00Z','Toronto','BMO Field','GHA','PAN','Ghana','Panama','a_venir'),
  ('WC024','Groupe K','group','K','2026-06-18T02:00:00Z','Mexico','Estadio Azteca','UZB','COL','Ouzbékistan','Colombie','a_venir'),
  ('WC025','Groupe A','group','A','2026-06-18T16:00:00Z','Atlanta','Mercedes-Benz Stadium','CZE','RSA','Tchéquie','Afrique du Sud','a_venir'),
  ('WC026','Groupe B','group','B','2026-06-18T19:00:00Z','Los Angeles','SoFi Stadium','SUI','BIH','Suisse','Bosnie-Herz.','a_venir'),
  ('WC027','Groupe B','group','B','2026-06-18T22:00:00Z','Vancouver','BC Place','CAN','QAT','Canada','Qatar','a_venir'),
  ('WC028','Groupe A','group','A','2026-06-19T03:00:00Z','Guadalajara','Estadio Akron','MEX','KOR','Mexique','Corée du Sud','a_venir')
on conflict (id) do update set
  phase=excluded.phase, kickoff=excluded.kickoff, venue_city=excluded.venue_city,
  venue_stade=excluded.venue_stade, home=excluded.home, away=excluded.away,
  home_name=excluded.home_name, away_name=excluded.away_name, grp=excluded.grp;
