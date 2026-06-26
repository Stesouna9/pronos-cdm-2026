/* ============================================================
   seed-r32.mjs — remplit les 16es de finale (Round of 32).
   - pose les créneaux (home_from/away_from) selon le tableau
     officiel FIFA 2026 (matchs 73→88, mappés sur WC073→WC088) ;
   - remplit les ÉQUIPES des groupes DÉJÀ TERMINÉS (1er/2e) ;
   - laisse les 3es et les groupes en cours "à déterminer".
   Idempotent : relançable à chaque fin de groupe.
   Variables d'env : SUPABASE_URL, SUPABASE_SERVICE_ROLE.
   ============================================================ */
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("❌ Manque SUPABASE_URL / SUPABASE_SERVICE_ROLE.");
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

// Structure officielle R32 → WC073..088 (mappée par ville/date).
// slot = ["W"|"R", "Groupe"] (vainqueur/2e) · ["3", null] = meilleur 3e (à déterminer).
const R32 = {
  WC073: { h: ["R", "A"], a: ["R", "B"], hf: "2e Groupe A", af: "2e Groupe B" },
  WC074: { h: ["W", "C"], a: ["3", null], hf: "1er Groupe C", af: "3e (à déterminer)" },
  WC075: { h: ["W", "E"], a: ["3", null], hf: "1er Groupe E", af: "3e (à déterminer)" },
  WC076: { h: ["W", "F"], a: ["R", "C"], hf: "1er Groupe F", af: "2e Groupe C" },
  WC077: { h: ["R", "E"], a: ["R", "I"], hf: "2e Groupe E", af: "2e Groupe I" },
  WC078: { h: ["W", "I"], a: ["3", null], hf: "1er Groupe I", af: "3e (à déterminer)" },
  WC079: { h: ["W", "A"], a: ["3", null], hf: "1er Groupe A", af: "3e (à déterminer)" },
  WC080: { h: ["W", "L"], a: ["3", null], hf: "1er Groupe L", af: "3e (à déterminer)" },
  WC081: { h: ["W", "G"], a: ["3", null], hf: "1er Groupe G", af: "3e (à déterminer)" },
  WC082: { h: ["W", "D"], a: ["3", null], hf: "1er Groupe D", af: "3e (à déterminer)" },
  WC083: { h: ["W", "H"], a: ["R", "J"], hf: "1er Groupe H", af: "2e Groupe J" },
  WC084: { h: ["R", "K"], a: ["R", "L"], hf: "2e Groupe K", af: "2e Groupe L" },
  WC085: { h: ["W", "B"], a: ["3", null], hf: "1er Groupe B", af: "3e (à déterminer)" },
  WC086: { h: ["R", "D"], a: ["R", "G"], hf: "2e Groupe D", af: "2e Groupe G" },
  WC087: { h: ["W", "J"], a: ["R", "H"], hf: "1er Groupe J", af: "2e Groupe H" },
  WC088: { h: ["W", "K"], a: ["3", null], hf: "1er Groupe K", af: "3e (à déterminer)" },
};

function standings(groupMatches) {
  const T = {};
  const add = (code, name) => (T[code] = T[code] || { code, name, pts: 0, gf: 0, ga: 0 });
  for (const m of groupMatches) {
    if (m.status !== "fini" || m.score_home == null) continue;
    const H = add(m.home, m.home_name), A = add(m.away, m.away_name);
    H.gf += m.score_home; H.ga += m.score_away; A.gf += m.score_away; A.ga += m.score_home;
    if (m.score_home > m.score_away) H.pts += 3;
    else if (m.score_home < m.score_away) A.pts += 3;
    else { H.pts++; A.pts++; }
  }
  return Object.values(T).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
}

async function main() {
  const { data: grp, error } = await sb.from("matches")
    .select("grp, home, away, home_name, away_name, score_home, score_away, status")
    .eq("round", "group");
  if (error) throw error;
  const byGroup = {};
  grp.forEach((m) => (byGroup[m.grp] = byGroup[m.grp] || []).push(m));
  // classement + statut "fini" par groupe
  const G = {};
  for (const g of Object.keys(byGroup)) {
    const ms = byGroup[g];
    G[g] = { fini: ms.length === 6 && ms.every((m) => m.status === "fini"), table: standings(ms) };
  }
  const teamFor = (slot) => {
    const [type, g] = slot;
    if (type === "3" || !G[g] || !G[g].fini) return null;          // 3e ou groupe pas fini
    const t = type === "W" ? G[g].table[0] : G[g].table[1];
    return t ? { code: t.code, name: t.name } : null;
  };

  let filledTeams = 0;
  for (const [id, cfg] of Object.entries(R32)) {
    const patch = { home_from: cfg.hf, away_from: cfg.af };
    const H = teamFor(cfg.h), A = teamFor(cfg.a);
    if (H) { patch.home = H.code; patch.home_name = H.name; }
    if (A) { patch.away = A.code; patch.away_name = A.name; }
    const { error: e2 } = await sb.from("matches").update(patch).eq("id", id);
    if (e2) { console.error("  ⚠️", id, e2.message); continue; }
    const lbl = `${H ? H.code : cfg.hf} vs ${A ? A.code : cfg.af}`;
    if (H) filledTeams++; if (A) filledTeams++;
    console.log(`  ✓ ${id} : ${lbl}`);
  }
  console.log(`✅ 16es : créneaux posés, ${filledTeams} équipe(s) remplie(s) (groupes terminés).`);
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); });
