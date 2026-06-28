/* ============================================================
   seed-r32.mjs — écrit les 16es de finale à l'identique du
   tableau OFFICIEL (fourni par Gabriel). Pairs fixes : pas de
   calcul des 3es (l'attribution officielle prime). Idempotent.
   Env : SUPABASE_URL, SUPABASE_SERVICE_ROLE.
   ============================================================ */
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("❌ Manque SUPABASE_URL / SUPABASE_SERVICE_ROLE.");
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

// Affiches officielles des 16es (codes FIFA) — mappées WC073..088 par date/ville.
const PAIRS = {
  WC073: ["RSA", "CAN"], WC074: ["BRA", "JPN"], WC075: ["GER", "PAR"], WC076: ["NED", "MAR"],
  WC077: ["CIV", "NOR"], WC078: ["FRA", "SWE"], WC079: ["MEX", "ECU"], WC080: ["ENG", "COD"],
  WC081: ["BEL", "SEN"], WC082: ["USA", "BIH"], WC083: ["ESP", "AUT"], WC084: ["POR", "CRO"],
  WC085: ["SUI", "ALG"], WC086: ["AUS", "EGY"], WC087: ["ARG", "CPV"], WC088: ["COL", "GHA"],
};
// Noms de secours (au cas où le code n'apparaît pas dans les données de groupe).
const NAME = {
  RSA: "Afrique du Sud", CAN: "Canada", BRA: "Brésil", JPN: "Japon", GER: "Allemagne",
  PAR: "Paraguay", NED: "Pays-Bas", MAR: "Maroc", CIV: "Côte d'Ivoire", NOR: "Norvège",
  FRA: "France", SWE: "Suède", MEX: "Mexique", ECU: "Équateur", ENG: "Angleterre",
  COD: "RD Congo", BEL: "Belgique", SEN: "Sénégal", USA: "États-Unis", BIH: "Bosnie-Herz.",
  ESP: "Espagne", AUT: "Autriche", POR: "Portugal", CRO: "Croatie", SUI: "Suisse",
  ALG: "Algérie", AUS: "Australie", EGY: "Égypte", ARG: "Argentine", CPV: "Cap-Vert",
  COL: "Colombie", GHA: "Ghana",
};

async function main() {
  // code -> nom depuis les matchs existants (priorité aux noms déjà en base)
  const { data: ms } = await sb.from("matches").select("home, away, home_name, away_name");
  const byCode = {};
  (ms || []).forEach((m) => { if (m.home && m.home_name) byCode[m.home] = m.home_name; if (m.away && m.away_name) byCode[m.away] = m.away_name; });
  const nameOf = (c) => byCode[c] || NAME[c] || c;

  let n = 0;
  for (const [id, [h, a]] of Object.entries(PAIRS)) {
    const patch = { home: h, away: a, home_name: nameOf(h), away_name: nameOf(a) };
    const { error } = await sb.from("matches").update(patch).eq("id", id);
    if (error) { console.error("  ⚠️", id, error.message); continue; }
    n++; console.log(`  ✓ ${id} : ${h} - ${a}`);
  }
  console.log(`✅ 16es écrits à l'identique du tableau officiel (${n}/16).`);
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); });
