/* ============================================================
   fetch-results.mjs
   --------------------------------------------------------
   Va chercher les matchs + scores de la Coupe du Monde via
   l'API football-data.org (offre gratuite), et les range
   dans Supabase. Sert à la fois de :
     - SEEDER     : importe le calendrier (1re fois)
     - METTEUR À JOUR : remplit les scores au fil des matchs
   Lancé par GitHub Actions toutes les 20 min (voir le workflow
   fetch-results.yml), ou à la main : `npm run fetch-results`.

   Variables d'environnement nécessaires (secrets GitHub) :
     SUPABASE_URL          = https://xxxx.supabase.co
     SUPABASE_SERVICE_ROLE = clé "service_role" (SECRÈTE — jamais publique)
     FOOTBALL_API_KEY      = clé football-data.org
     FOOTBALL_COMPETITION  = code compétition (défaut "WC")
   ============================================================ */
import { createClient } from "@supabase/supabase-js";

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE,
  FOOTBALL_API_KEY,
  FOOTBALL_COMPETITION = "WC",
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE || !FOOTBALL_API_KEY) {
  console.error("❌ Variables manquantes : SUPABASE_URL, SUPABASE_SERVICE_ROLE, FOOTBALL_API_KEY.");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

// --- Récupère tous les matchs de la compétition ---
async function fetchMatches() {
  const url = `https://api.football-data.org/v4/competitions/${FOOTBALL_COMPETITION}/matches`;
  const res = await fetch(url, { headers: { "X-Auth-Token": FOOTBALL_API_KEY } });
  if (!res.ok) {
    throw new Error(`API football-data ${res.status} : ${await res.text()}`);
  }
  const json = await res.json();
  return json.matches || [];
}

// --- Traduit le statut de l'API vers le nôtre ---
function mapStatus(s) {
  return s === "FINISHED" ? "fini" : "a_venir";
}

// --- Traduit un match API vers une ligne de notre table ---
function toRow(m) {
  const ft = m.score?.fullTime || {};
  const pen = m.score?.penalties || {};
  const fini = m.status === "FINISHED";
  const sh = ft.home, sa = ft.away;
  let winner = null;
  if (fini && sh != null && sa != null) {
    if (sh > sa) winner = m.homeTeam?.tla || m.homeTeam?.name;
    else if (sa > sh) winner = m.awayTeam?.tla || m.awayTeam?.name;
    else if (pen.home != null && pen.away != null) {
      winner = pen.home > pen.away ? (m.homeTeam?.tla || m.homeTeam?.name) : (m.awayTeam?.tla || m.awayTeam?.name);
    }
  }
  return {
    id: "F" + m.id,                         // id stable basé sur l'API
    phase: frPhase(m.stage, m.group),
    round: m.stage === "GROUP_STAGE" ? "group" : "ko",
    grp: m.group ? m.group.replace("GROUP_", "") : null,
    kickoff: m.utcDate,
    venue_city: m.venue || null,
    venue_stade: m.venue || null,
    home: m.homeTeam?.tla || null,
    away: m.awayTeam?.tla || null,
    home_name: m.homeTeam?.name || null,
    away_name: m.awayTeam?.name || null,
    score_home: sh ?? null,
    score_away: sa ?? null,
    pens_home: pen.home ?? null,
    pens_away: pen.away ?? null,
    status: mapStatus(m.status),
    winner,
    updated_at: new Date().toISOString(),
  };
}

function frPhase(stage, group) {
  const map = {
    GROUP_STAGE: group ? "Groupe " + group.replace("GROUP_", "") : "Phase de groupes",
    LAST_16: "8es de finale",
    QUARTER_FINALS: "Quarts de finale",
    SEMI_FINALS: "Demi-finales",
    THIRD_PLACE: "Match pour la 3e place",
    FINAL: "Finale",
  };
  return map[stage] || stage;
}

async function main() {
  console.log("⏳ Récupération des matchs…");
  const matches = await fetchMatches();
  console.log(`📥 ${matches.length} matchs reçus de l'API.`);
  if (!matches.length) return;

  const rows = matches.map(toRow);
  // upsert par paquets pour rester sous les limites
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await sb.from("matches").upsert(batch, { onConflict: "id" });
    if (error) throw new Error("Supabase upsert : " + error.message);
  }
  const finis = rows.filter((r) => r.status === "fini").length;
  console.log(`✅ ${rows.length} matchs synchronisés (${finis} terminés). Points recalculés par la base.`);
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
