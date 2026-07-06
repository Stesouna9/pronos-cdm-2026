/* ============================================================
   fix-kickoff.mjs — corrige la date/heure d'un match précis.
   Demande Gabriel : Brésil–Norvège (WC093) = ce soir dim 5 juil,
   21h Paris (= 19:00 UTC).
   Env : SUPABASE_URL, SUPABASE_SERVICE_ROLE.
   ============================================================ */
import { createClient } from "@supabase/supabase-js";
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) { console.error("❌ env manquantes"); process.exit(1); }
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

const FIXES = [
  // Portugal-Espagne : a débuté à 21h (dim 5 juil), déjà en cours.
  // 21h Paris (CEST, UTC+2) = 19:00 UTC. Ferme les pronos immédiatement.
  { id: "WC092", kickoff: "2026-07-05T19:00:00+00:00" }, // dim 5 juil 21h Paris
];

async function main() {
  for (const f of FIXES) {
    const { error } = await sb.from("matches").update({ kickoff: f.kickoff }).eq("id", f.id);
    if (error) { console.error("  ⚠️", f.id, error.message); continue; }
    console.log(`  ✓ ${f.id} -> ${f.kickoff}`);
  }
  console.log("✅ Dates corrigées.");
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); });
