/* Sauvegarde JSON des tables de la ligue (artefact GitHub Actions). */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

mkdirSync("backup", { recursive: true });
let total = 0;
for (const table of ["profiles", "matches", "predictions", "reactions"]) {
  const { data, error } = await sb.from(table).select("*");
  if (error) { console.error(table, error.message); process.exit(1); }
  writeFileSync(`backup/${table}.json`, JSON.stringify(data, null, 1));
  console.log(`✓ ${table}: ${data.length} lignes`);
  total += data.length;
}
console.log(`✅ Sauvegarde complète (${total} lignes).`);
