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

// Recalage complet des 8es sur le calendrier officiel FIFA 2026 (heure Paris = UTC+2).
// On ne touche QUE les horaires (jamais les scores).
const FIXES = [
  { id: "WC091", kickoff: "2026-07-07T00:00:00+00:00" }, // USA-Belgique   -> mar 7 juil 02h
  { id: "WC092", kickoff: "2026-07-06T19:00:00+00:00" }, // Portugal-Espagne -> lun 6 juil 21h
  { id: "WC093", kickoff: "2026-07-05T20:00:00+00:00" }, // Brésil-Norvège -> dim 5 juil 22h (fini)
  { id: "WC095", kickoff: "2026-07-07T20:00:00+00:00" }, // Suisse-Colombie -> mar 7 juil 22h
  { id: "WC096", kickoff: "2026-07-07T16:00:00+00:00" }, // Argentine-Égypte -> mar 7 juil 18h
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
