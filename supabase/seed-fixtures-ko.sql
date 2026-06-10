-- Pronos CDM 2026 — Phase finale (16es → finale). Équipes à déterminer.
-- Dates/stades officiels approx. UTC (ET+4). round='ko', teams null.
insert into public.matches
  (id, phase, round, grp, kickoff, venue_city, venue_stade, home, away, status)
values
  ('WC073','32èmes de finale','ko',null,'2026-06-28T19:00:00Z','Los Angeles','SoFi Stadium',null,null,'a_venir'),
  ('WC074','32èmes de finale','ko',null,'2026-06-29T17:00:00Z','Houston','NRG Stadium',null,null,'a_venir'),
  ('WC075','32èmes de finale','ko',null,'2026-06-29T20:30:00Z','Boston','Gillette Stadium',null,null,'a_venir'),
  ('WC076','32èmes de finale','ko',null,'2026-06-30T01:00:00Z','Monterrey','Estadio BBVA',null,null,'a_venir'),
  ('WC077','32èmes de finale','ko',null,'2026-06-30T17:00:00Z','Dallas','AT&T Stadium',null,null,'a_venir'),
  ('WC078','32èmes de finale','ko',null,'2026-06-30T21:00:00Z','New York / NJ','MetLife Stadium',null,null,'a_venir'),
  ('WC079','32èmes de finale','ko',null,'2026-07-01T01:00:00Z','Mexico','Estadio Azteca',null,null,'a_venir'),
  ('WC080','32èmes de finale','ko',null,'2026-07-01T16:00:00Z','Atlanta','Mercedes-Benz Stadium',null,null,'a_venir'),
  ('WC081','32èmes de finale','ko',null,'2026-07-01T20:00:00Z','Seattle','Lumen Field',null,null,'a_venir'),
  ('WC082','32èmes de finale','ko',null,'2026-07-02T00:00:00Z','San Francisco','Levi''s Stadium',null,null,'a_venir'),
  ('WC083','32èmes de finale','ko',null,'2026-07-02T19:00:00Z','Los Angeles','SoFi Stadium',null,null,'a_venir'),
  ('WC084','32èmes de finale','ko',null,'2026-07-02T23:00:00Z','Toronto','BMO Field',null,null,'a_venir'),
  ('WC085','32èmes de finale','ko',null,'2026-07-03T03:00:00Z','Vancouver','BC Place',null,null,'a_venir'),
  ('WC086','32èmes de finale','ko',null,'2026-07-03T18:00:00Z','Dallas','AT&T Stadium',null,null,'a_venir'),
  ('WC087','32èmes de finale','ko',null,'2026-07-03T22:00:00Z','Miami','Hard Rock Stadium',null,null,'a_venir'),
  ('WC088','32èmes de finale','ko',null,'2026-07-04T01:30:00Z','Kansas City','Arrowhead Stadium',null,null,'a_venir'),
  ('WC089','16èmes de finale','ko',null,'2026-07-04T17:00:00Z','Houston','NRG Stadium',null,null,'a_venir'),
  ('WC090','16èmes de finale','ko',null,'2026-07-04T21:00:00Z','Philadelphie','Lincoln Financial Field',null,null,'a_venir'),
  ('WC091','16èmes de finale','ko',null,'2026-07-05T20:00:00Z','New York / NJ','MetLife Stadium',null,null,'a_venir'),
  ('WC092','16èmes de finale','ko',null,'2026-07-06T00:00:00Z','Mexico','Estadio Azteca',null,null,'a_venir'),
  ('WC093','16èmes de finale','ko',null,'2026-07-06T19:00:00Z','Dallas','AT&T Stadium',null,null,'a_venir'),
  ('WC094','16èmes de finale','ko',null,'2026-07-06T21:00:00Z','Seattle','Lumen Field',null,null,'a_venir'),
  ('WC095','16èmes de finale','ko',null,'2026-07-07T16:00:00Z','Atlanta','Mercedes-Benz Stadium',null,null,'a_venir'),
  ('WC096','16èmes de finale','ko',null,'2026-07-07T20:00:00Z','Vancouver','BC Place',null,null,'a_venir'),
  ('WC097','Quarts de finale','ko',null,'2026-07-09T20:00:00Z','Boston','Gillette Stadium',null,null,'a_venir'),
  ('WC098','Quarts de finale','ko',null,'2026-07-10T19:00:00Z','Los Angeles','SoFi Stadium',null,null,'a_venir'),
  ('WC099','Quarts de finale','ko',null,'2026-07-11T21:00:00Z','Miami','Hard Rock Stadium',null,null,'a_venir'),
  ('WC100','Quarts de finale','ko',null,'2026-07-12T01:00:00Z','Kansas City','Arrowhead Stadium',null,null,'a_venir'),
  ('WC101','Demi-finales','ko',null,'2026-07-14T19:00:00Z','Dallas','AT&T Stadium',null,null,'a_venir'),
  ('WC102','Demi-finales','ko',null,'2026-07-15T19:00:00Z','Atlanta','Mercedes-Benz Stadium',null,null,'a_venir'),
  ('WC103','Match pour la 3e place','ko',null,'2026-07-18T21:00:00Z','Miami','Hard Rock Stadium',null,null,'a_venir'),
  ('WC104','Finale','ko',null,'2026-07-19T19:00:00Z','New York / NJ','MetLife Stadium',null,null,'a_venir')
on conflict (id) do update set
  phase=excluded.phase, kickoff=excluded.kickoff, venue_city=excluded.venue_city,
  venue_stade=excluded.venue_stade, status=excluded.status;
