/* ============================================================
   seed-r32.mjs — remplit les 16es de finale (Round of 32).
   Tableau officiel FIFA 2026 (matchs 73→88 → WC073→WC088) :
   1ers, 2es, et les 8 MEILLEURS 3es affectés à leurs créneaux
   (chaque créneau "3e" autorise certains groupes → affectation
   par couplage, comme la table officielle FIFA).
   Idempotent. Env : SUPABASE_URL, SUPABASE_SERVICE_ROLE.
   ============================================================ */
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("❌ Manque SUPABASE_URL / SUPABASE_SERVICE_ROLE.");
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

// slot home = ["W"|"R", groupe] · slot away "3" = meilleur 3e parmi `groups`.
const R32 = {
  WC073: { h: ["R", "A"], a: ["R", "B"], hf: "2e Groupe A", af: "2e Groupe B" },
  WC074: { h: ["W", "C"], a: ["R", "F"], hf: "1er Groupe C", af: "2e Groupe F" },
  WC075: { h: ["W", "E"], a: ["3", "ABCDF"], hf: "1er Groupe E", af: "3e Groupe A/B/C/D/F" },
  WC076: { h: ["W", "F"], a: ["R", "C"], hf: "1er Groupe F", af: "2e Groupe C" },
  WC077: { h: ["R", "E"], a: ["R", "I"], hf: "2e Groupe E", af: "2e Groupe I" },
  WC078: { h: ["W", "I"], a: ["3", "CDFGH"], hf: "1er Groupe I", af: "3e Groupe C/D/F/G/H" },
  WC079: { h: ["W", "A"], a: ["3", "CEFHI"], hf: "1er Groupe A", af: "3e Groupe C/E/F/H/I" },
  WC080: { h: ["W", "L"], a: ["3", "EHIJK"], hf: "1er Groupe L", af: "3e Groupe E/H/I/J/K" },
  WC081: { h: ["W", "G"], a: ["3", "AEHIJ"], hf: "1er Groupe G", af: "3e Groupe A/E/H/I/J" },
  WC082: { h: ["W", "D"], a: ["3", "BEFIJ"], hf: "1er Groupe D", af: "3e Groupe B/E/F/I/J" },
  WC083: { h: ["W", "H"], a: ["R", "J"], hf: "1er Groupe H", af: "2e Groupe J" },
  WC084: { h: ["R", "K"], a: ["R", "L"], hf: "2e Groupe K", af: "2e Groupe L" },
  WC085: { h: ["W", "B"], a: ["3", "EFGIJ"], hf: "1er Groupe B", af: "3e Groupe E/F/G/I/J" },
  WC086: { h: ["R", "D"], a: ["R", "G"], hf: "2e Groupe D", af: "2e Groupe G" },
  WC087: { h: ["W", "J"], a: ["R", "H"], hf: "1er Groupe J", af: "2e Groupe H" },
  WC088: { h: ["W", "K"], a: ["3", "DEIJL"], hf: "1er Groupe K", af: "3e Groupe D/E/I/J/L" },
};

function standings(ms) {
  const T = {};
  const add = (c, n) => (T[c] = T[c] || { code: c, name: n, pts: 0, gf: 0, ga: 0 });
  for (const m of ms) {
    if (m.status !== "fini" || m.score_home == null) continue;
    const H = add(m.home, m.home_name), A = add(m.away, m.away_name);
    H.gf += m.score_home; H.ga += m.score_away; A.gf += m.score_away; A.ga += m.score_home;
    if (m.score_home > m.score_away) H.pts += 3;
    else if (m.score_home < m.score_away) A.pts += 3;
    else { H.pts++; A.pts++; }
  }
  return Object.values(T).map((x) => ({ ...x, gd: x.gf - x.ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}

// Couplage des 3es qualifiés aux créneaux "3e" (chacun limité à certains groupes).
function assignThirds(thirdByGroup, qualified, slots) {
  const out = {};
  function bt(i, used) {
    if (i === slots.length) return true;
    const s = slots[i];
    for (const g of s.groups) {
      if (used.has(g) || !qualified.has(g) || !thirdByGroup[g]) continue;
      used.add(g); out[s.id] = thirdByGroup[g];
      if (bt(i + 1, used)) return true;
      used.delete(g); delete out[s.id];
    }
    return false;
  }
  return bt(0, new Set()) ? out : null;
}

async function main() {
  const { data: grp, error } = await sb.from("matches")
    .select("grp, home, away, home_name, away_name, score_home, score_away, status").eq("round", "group");
  if (error) throw error;
  const byGroup = {};
  grp.forEach((m) => (byGroup[m.grp] = byGroup[m.grp] || []).push(m));

  const G = {}, thirdByGroup = {}, thirdsRanked = [];
  for (const g of Object.keys(byGroup)) {
    const ms = byGroup[g];
    const fini = ms.length === 6 && ms.every((m) => m.status === "fini");
    const table = standings(ms);
    G[g] = { fini, table };
    if (fini && table[2]) { thirdByGroup[g] = table[2]; thirdsRanked.push({ ...table[2], group: g }); }
  }
  // 8 meilleurs 3es
  thirdsRanked.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  const qualified = new Set(thirdsRanked.slice(0, 8).map((x) => x.group));
  console.log("🥉 8 meilleurs 3es :", thirdsRanked.slice(0, 8).map((x) => x.group + ":" + x.code).join(", "));

  // créneaux 3e + affectation
  const slots = Object.entries(R32).filter(([, c]) => c.a[0] === "3").map(([id, c]) => ({ id, groups: c.a[1].split("") }));
  const assign = assignThirds(thirdByGroup, qualified, slots) || {};
  if (!Object.keys(assign).length) console.error("⚠️ couplage des 3es impossible (groupes pas tous finis ?)");

  const teamFor = (slot, id, side) => {
    const [type, g] = slot;
    if (type === "3") { const t = assign[id]; return t ? { code: t.code, name: t.name } : null; }
    if (!G[g] || !G[g].fini) return null;
    const t = type === "W" ? G[g].table[0] : G[g].table[1];
    return t ? { code: t.code, name: t.name } : null;
  };

  let filled = 0;
  for (const [id, cfg] of Object.entries(R32)) {
    const patch = { home_from: cfg.hf, away_from: cfg.af };
    const H = teamFor(cfg.h, id, "h"), A = teamFor(cfg.a, id, "a");
    if (H) { patch.home = H.code; patch.home_name = H.name; filled++; }
    if (A) { patch.away = A.code; patch.away_name = A.name; filled++; }
    const { error: e2 } = await sb.from("matches").update(patch).eq("id", id);
    if (e2) { console.error("  ⚠️", id, e2.message); continue; }
    console.log(`  ✓ ${id} : ${H ? H.code : cfg.hf} vs ${A ? A.code : cfg.af}`);
  }
  console.log(`✅ 16es : ${filled} équipe(s) placée(s).`);
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); });
