/* ============================================================
   fetch-results-apify.mjs
   --------------------------------------------------------
   Récupère les scores des matchs CDM 2026 via l'actor Apify
   "extractify-labs/flashscore-live-matches" (matchs en direct
   du monde entier), filtre les matchs de la Coupe du Monde par
   noms d'équipes, et met à jour Supabase. Les points sont
   recalculés par le trigger SQL quand un match passe à "fini".

   Lancé par GitHub Actions (cron). Variables d'env (secrets) :
     APIFY_TOKEN           = clé API Apify
     SUPABASE_URL          = https://xxxx.supabase.co
     SUPABASE_SERVICE_ROLE = clé service_role (SECRÈTE)
     APIFY_ACTOR           = (option) défaut extractify-labs~flashscore-live-matches
     APIFY_MAX_ITEMS       = (option) défaut 60
   ============================================================ */
import { createClient } from "@supabase/supabase-js";
import { pushConfigured, setupPush, sendToSubs, resultSubs, adminSubs } from "./push-utils.mjs";

const {
  APIFY_TOKEN,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE,
  APIFY_ACTOR = "extractify-labs~flashscore-live-matches",
  APIFY_MAX_ITEMS = "60",
} = process.env;

if (!APIFY_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("❌ Manque APIFY_TOKEN / SUPABASE_URL / SUPABASE_SERVICE_ROLE.");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

// --- Noms d'équipes (anglais Flashscore) -> code FIFA ---
const NAME2CODE = {
  mexico: "MEX", "south africa": "RSA", "south korea": "KOR", "korea republic": "KOR",
  czechia: "CZE", "czech republic": "CZE", canada: "CAN", "bosnia herzegovina": "BIH",
  "bosnia and herzegovina": "BIH", qatar: "QAT", switzerland: "SUI", brazil: "BRA",
  morocco: "MAR", haiti: "HAI", scotland: "SCO", "united states": "USA", usa: "USA",
  paraguay: "PAR", australia: "AUS", turkey: "TUR", turkiye: "TUR", germany: "GER",
  curacao: "CUW", "ivory coast": "CIV", "cote divoire": "CIV", ecuador: "ECU",
  netherlands: "NED", japan: "JPN", sweden: "SWE", tunisia: "TUN", belgium: "BEL",
  egypt: "EGY", iran: "IRN", "new zealand": "NZL", spain: "ESP", "cape verde": "CPV",
  "cabo verde": "CPV", "saudi arabia": "KSA", uruguay: "URU", france: "FRA", senegal: "SEN",
  iraq: "IRQ", norway: "NOR", argentina: "ARG", algeria: "ALG", austria: "AUT",
  jordan: "JOR", portugal: "POR", "dr congo": "COD", "congo dr": "COD", "congo democratic republic": "COD",
  uzbekistan: "UZB", colombia: "COL", england: "ENG", croatia: "CRO", ghana: "GHA", panama: "PAN",
};

function norm(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
}
function code(name) { return NAME2CODE[norm(name)] || null; }

// statuts Flashscore considérés comme "terminé"
function isFinished(s) {
  const x = (s || "").toUpperCase();
  return ["FINISHED", "AFTER_ET", "AFTER_PENALTIES", "AFTER ET", "AFTER PENALTIES", "FT", "AET", "PEN"].some((k) => x.includes(k));
}

async function runActor() {
  const start = await fetch(`https://api.apify.com/v2/acts/${APIFY_ACTOR}/runs`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${APIFY_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ maxItems: Number(APIFY_MAX_ITEMS), includeStatistics: false, includeLineups: false, includeOdds: false }),
  });
  if (!start.ok) throw new Error("Apify run " + start.status + " : " + (await start.text()));
  const runId = (await start.json()).data.id;
  // attendre la fin (max ~3 min)
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 6000));
    const r = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, { headers: { "Authorization": `Bearer ${APIFY_TOKEN}` } });
    const st = (await r.json()).data.status;
    if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(st)) {
      if (st !== "SUCCEEDED") throw new Error("Run Apify " + st);
      break;
    }
  }
  const items = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?clean=true`, {
    headers: { "Authorization": `Bearer ${APIFY_TOKEN}` },
  });
  return await items.json();
}

/* Alerte l'admin (Gabriel) quand une action manuelle est nécessaire :
   - match sorti de la fenêtre du robot sans score → à saisir dans Admin
   - match nul en phase finale sans vainqueur t.a.b. → à valider dans Admin
   Une seule alerte par match (admin_nag_at). */
async function checkAdminAlerts() {
  if (!pushConfigured()) return;
  const now = Date.now(), H = 3600e3;
  const { data: all } = await sb.from("matches")
    .select("id, home_name, away_name, kickoff, status, round, score_home, score_away, winner, admin_nag_at")
    .not("home", "is", null);
  const missed = (all || []).filter((m) =>
    m.status !== "fini" && !m.admin_nag_at && now > new Date(m.kickoff).getTime() + 8 * H);
  const needPens = (all || []).filter((m) =>
    m.status === "fini" && m.round === "ko" && !m.admin_nag_at
    && m.score_home != null && m.score_home === m.score_away && !m.winner);
  if (!missed.length && !needPens.length) return;
  const subs = await adminSubs(sb);
  for (const m of missed) {
    const n = await sendToSubs(sb, subs, {
      title: "✍️ Score à saisir",
      body: `${m.home_name} – ${m.away_name} : le robot n'a pas trouvé le score. Saisis-le dans Admin → Scores.`,
      tag: "admin-" + m.id,
    });
    await sb.from("matches").update({ admin_nag_at: new Date().toISOString() }).eq("id", m.id);
    console.log(`🔔 Alerte admin (score manquant) ${m.id} → ${n} appareil(s)`);
  }
  for (const m of needPens) {
    const n = await sendToSubs(sb, subs, {
      title: "🥅 Tirs au but à valider",
      body: `${m.home_name} – ${m.away_name} (${m.score_home}-${m.score_away}) : valide le vainqueur aux tirs au but dans Admin.`,
      tag: "admin-" + m.id,
    });
    await sb.from("matches").update({ admin_nag_at: new Date().toISOString() }).eq("id", m.id);
    console.log(`🔔 Alerte admin (t.a.b.) ${m.id} → ${n} appareil(s)`);
  }
}

async function main() {
  if (pushConfigured()) setupPush();
  // Garde "fin de match" : on n'appelle Apify QUE si un match a commencé il y a
  // plus de 3h (durée max d'un match) et n'a pas encore son score. Fenêtre de
  // 8h max — au-delà, le flux live ne l'a plus, c'est la saisie Admin qui prend.
  const now = Date.now(), H = 3600e3;
  const { data: open, error: e0 } = await sb
    .from("matches").select("id, home_name, away_name, kickoff")
    .neq("status", "fini").not("home", "is", null);
  if (e0) throw e0;
  const due = (open || []).filter((m) => {
    const k = new Date(m.kickoff).getTime();
    return now >= k + 3 * H && now <= k + 8 * H;
  });
  if (!due.length) {
    console.log("✅ Aucun match en attente de score (fenêtre kickoff+3h→8h). Pas d'appel Apify.");
    await checkAdminAlerts();
    return;
  }
  console.log("🎯 Matchs à scorer :", due.map((m) => `${m.home_name}-${m.away_name}`).join(", "));

  console.log("⏳ Lancement de l'actor Flashscore…");
  const items = await runActor();
  console.log(`📥 ${items.length} matchs live récupérés.`);

  // index de mes matchs par paire de codes
  const { data: matches, error } = await sb.from("matches").select("id, home, away, status, home_name, away_name");
  if (error) throw error;
  const byPair = {};
  matches.forEach((m) => { if (m.home && m.away) byPair[[m.home, m.away].sort().join("|")] = m; });

  let updated = 0;
  const finished = []; // matchs passés à "fini" pendant ce run → notification joueurs
  for (const it of items) {
    const ch = code(it.home_team), ca = code(it.away_team);
    if (!ch || !ca) continue;                       // pas une équipe CDM
    const m = byPair[[ch, ca].sort().join("|")];
    if (!m) continue;                               // pas un match CDM connu
    if (it.home_score == null || it.away_score == null) continue;

    // orienter le score selon MON sens domicile/extérieur
    const sh = ch === m.home ? it.home_score : it.away_score;
    const sa = ch === m.home ? it.away_score : it.home_score;
    const fini = isFinished(it.status);
    const winner = fini ? (sh > sa ? m.home : sa > sh ? m.away : null) : null;

    const patch = { score_home: sh, score_away: sa, updated_at: new Date().toISOString() };
    if (fini) { patch.status = "fini"; patch.winner = winner; }

    const { error: e2 } = await sb.from("matches").update(patch).eq("id", m.id);
    if (e2) { console.error("  ⚠️ update", m.id, e2.message); continue; }
    updated++;
    if (fini && m.status !== "fini") finished.push({ ...m, sh, sa });
    console.log(`  ✓ ${m.id} ${m.home} ${sh}-${sa} ${m.away}${fini ? " (FINI)" : " (live)"}`);
  }
  console.log(`✅ ${updated} match(s) CDM mis à jour.`);

  // 🔔 notification "résultat" aux joueurs abonnés
  if (finished.length && pushConfigured()) {
    const subs = await resultSubs(sb);
    for (const m of finished) {
      const n = await sendToSubs(sb, subs, {
        title: `⚽ Terminé : ${m.home_name} ${m.sh}–${m.sa} ${m.away_name}`,
        body: "Les points sont calculés — viens voir le classement !",
        tag: "result-" + m.id,
      });
      console.log(`🔔 Résultat ${m.id} notifié → ${n} appareil(s)`);
    }
  }

  // alertes admin (score manquant / t.a.b. à valider)
  await checkAdminAlerts();
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
