/* admin-bonus.mjs — attribue les points bonus (ex : +10 au gagnant des
   mini-jeux avant les quarts). Service role. Déclenché par tag run-bonus*. */
import { createClient } from "@supabase/supabase-js";
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) { console.error("❌ env manquantes"); process.exit(1); }
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

// Gagnant des mini-jeux (décision Gabriel) : StarKane → +10 au classement général.
const BONUS = { id: "4daf6ca1-fdb5-4d8a-a7db-ba4810135e69", pts: 10 };

async function main() {
  const { error } = await sb.from("profiles").update({ bonus_pts: BONUS.pts }).eq("id", BONUS.id);
  if (error) throw error;
  console.log(`✅ +${BONUS.pts} bonus attribués à ${BONUS.id} (StarKane).`);
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); });
