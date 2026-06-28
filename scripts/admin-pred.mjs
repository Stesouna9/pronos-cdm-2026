/* ============================================================
   admin-pred.mjs — écrit un prono AU NOM d'un joueur (action
   admin ponctuelle, ex : son prono n'est pas passé à temps).
   Service role → contourne la RLS. Env : SUPABASE_URL,
   SUPABASE_SERVICE_ROLE. Édite PRED puis relance par tag.
   ============================================================ */
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("❌ Manque SUPABASE_URL / SUPABASE_SERVICE_ROLE.");
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

// Prono à enregistrer (validé par l'admin Gabriel).
// Guillaume = Cinephile ; Afrique du Sud 1 - 2 Canada (WC073).
const PRED = {
  user_id: "3ba43c6d-edc9-4137-bf71-b034917a89da",
  match_id: "WC073",
  pred_home: 1,
  pred_away: 2,
};

async function main() {
  const { error } = await sb.from("predictions").upsert(
    { ...PRED, updated_at: new Date().toISOString() },
    { onConflict: "user_id,match_id" }
  );
  if (error) throw error;
  console.log(`✅ Prono enregistré : ${PRED.match_id} ${PRED.pred_home}-${PRED.pred_away} pour ${PRED.user_id}`);
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); });
