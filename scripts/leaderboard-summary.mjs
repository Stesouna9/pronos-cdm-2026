/* Écrit le classement de la ligue en Markdown (pour le résumé GitHub Actions). */
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

const { data, error } = await sb
  .from("leaderboard")
  .select("pseudo, avatar, pts, exacts, bons, joues, created_at")
  .order("pts", { ascending: false })
  .order("exacts", { ascending: false })
  .order("created_at", { ascending: true });
if (error) { console.error(error.message); process.exit(1); }

const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`);
console.log("## 🏆 Classement — La CDM de Gabriel\n");
console.log("| # | Joueur | Pts | Exacts | Bons | Joués |");
console.log("|---|--------|-----|--------|------|-------|");
data.forEach((u, i) =>
  console.log(`| ${medal(i)} | ${u.avatar} ${u.pseudo} | **${u.pts}** | ${u.exacts} | ${u.bons} | ${u.joues} |`)
);
console.log(`\n_${data.length} joueurs · màj ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC_`);
