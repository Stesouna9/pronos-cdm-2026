/* gamesData.js — contenus des mini-jeux (FR).
   Le tirage du jour est le même pour toute la ligue (graine = date). */

/* Graine du jour + tirage déterministe (tout le monde a les mêmes énigmes). */
export function daySeed(dayStr) {
  let s = 7;
  for (const c of dayStr) s = ((s * 31 + c.charCodeAt(0)) >>> 0);
  return s;
}
export function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed >>> 0;
  const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Drapeaux emoji : code FIFA -> emoji (équipes CDM + quelques pièges). */
const ISO = {
  MEX: "MX", RSA: "ZA", KOR: "KR", CZE: "CZ", CAN: "CA", BIH: "BA", QAT: "QA",
  SUI: "CH", BRA: "BR", MAR: "MA", HAI: "HT", USA: "US", PAR: "PY", AUS: "AU",
  TUR: "TR", GER: "DE", CUW: "CW", CIV: "CI", ECU: "EC", NED: "NL", JPN: "JP",
  SWE: "SE", TUN: "TN", BEL: "BE", EGY: "EG", IRN: "IR", NZL: "NZ", ESP: "ES",
  CPV: "CV", KSA: "SA", URU: "UY", FRA: "FR", SEN: "SN", IRQ: "IQ", NOR: "NO",
  ARG: "AR", ALG: "DZ", AUT: "AT", JOR: "JO", POR: "PT", COD: "CD", UZB: "UZ",
  COL: "CO", CRO: "HR", GHA: "GH", PAN: "PA",
};
export function flagEmoji(fifa) {
  if (fifa === "ENG") return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
  if (fifa === "SCO") return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
  const iso = ISO[fifa];
  if (!iso) return "🏳️";
  return [...iso].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join("");
}
export const FLAG_POOL = Object.keys(ISO).concat(["ENG", "SCO"]);

/* Réflexe arbitre : action -> bonne décision (j = jaune, r = rouge, ok = laisser jouer). */
export const ARBITRE = [
  ["Tacle par derrière, semelle en avant", "r"],
  ["Simulation grossière dans la surface", "j"],
  ["Petit pont magnifique", "ok"],
  ["Main volontaire qui stoppe un but tout fait", "r"],
  ["Maillot tiré à 60 mètres du but", "j"],
  ["Contrôle de la poitrine, rien à signaler", "ok"],
  ["Insulte l'arbitre copieusement", "r"],
  ["Retire son maillot pour célébrer", "j"],
  ["Talonnade géniale au milieu", "ok"],
  ["Coup de coude volontaire au visage", "r"],
  ["Gagne son duel à l'épaule, propre", "ok"],
  ["Fauche l'attaquant, dernier défenseur", "r"],
  ["Râle sur une touche, gentiment", "ok"],
  ["Tacle en retard, prend la cheville", "j"],
  ["Crampons en avant à hauteur du genou", "r"],
  ["Une-deux superbe dans la surface", "ok"],
  ["Perd du temps sur un six mètres", "j"],
  ["Frappe enroulée sur la barre", "ok"],
  ["Crache vers un adversaire", "r"],
  ["Bloque la relance rapide avec la main", "j"],
  ["Grand pont plein axe", "ok"],
  ["Deuxième tacle imprudent (déjà averti)", "r"],
  ["Discute calmement avec le capitaine", "ok"],
  ["Casse les lunettes du 4e arbitre en shootant le ballon", "j"],
];
