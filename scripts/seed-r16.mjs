/* ============================================================
   seed-r16.mjs — planifie les 8es de finale (WC089→WC096).
   Structure officielle FIFA 2026 : chaque 8e = vainqueur de
   deux 16es. Pose les créneaux "Vainqueur X–Y" et remplit
   l'équipe dès qu'un 16e est terminé (winner). Idempotent :
   relançable après chaque 16e joué.
   Env : SUPABASE_URL, SUPABASE_SERVICE_ROLE.
   ============================================================ */
import { createClient } from "@supabase/supabase-js";
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) { console.error("❌ env manquantes"); process.exit(1); }
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

// 8e -> [16e source haut, 16e source bas] (ordre chronologique = tableau officiel).
const R16 = {
  WC089: ["WC073", "WC074"], WC090: ["WC075", "WC076"], WC091: ["WC077", "WC078"], WC092: ["WC079", "WC080"],
  WC093: ["WC081", "WC082"], WC094: ["WC083", "WC084"], WC095: ["WC085", "WC086"], WC096: ["WC087", "WC088"],
};

async function main() {
  const ids = [...new Set(Object.values(R16).flat())];
  const { data: src, error } = await sb.from("matches")
    .select("id, home, away, home_name, away_name, winner, status").in("id", ids);
  if (error) throw error;
  const byId = {}; src.forEach((m) => (byId[m.id] = m));

  const label = (m) => `Vainqueur ${m.home_name || m.home || "?"}–${m.away_name || m.away || "?"}`;
  const winnerOf = (m) => {
    if (m.status !== "fini" || !m.winner) return null;
    const name = m.winner === m.home ? m.home_name : m.winner === m.away ? m.away_name : m.winner;
    return { code: m.winner, name };
  };

  let filled = 0;
  for (const [id, [s1, s2]] of Object.entries(R16)) {
    const m1 = byId[s1], m2 = byId[s2];
    const patch = { home_from: m1 ? label(m1) : null, away_from: m2 ? label(m2) : null };
    const w1 = m1 && winnerOf(m1), w2 = m2 && winnerOf(m2);
    if (w1) { patch.home = w1.code; patch.home_name = w1.name; filled++; }
    if (w2) { patch.away = w2.code; patch.away_name = w2.name; filled++; }
    const { error: e2 } = await sb.from("matches").update(patch).eq("id", id);
    if (e2) { console.error("  ⚠️", id, e2.message); continue; }
    console.log(`  ✓ ${id} : ${w1 ? w1.code : patch.home_from} vs ${w2 ? w2.code : patch.away_from}`);
  }
  console.log(`✅ 8es planifiés (créneaux posés, ${filled} équipe(s) déjà qualifiée(s)).`);
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); });
